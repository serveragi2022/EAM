import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { url, headers } from "../api/httpclient";
import { getGName } from "../GlobalVariable";
import Spinner from "react-native-loading-spinner-overlay";
import DateTimePicker from "@react-native-community/datetimepicker";

const FittoWorkScreen = ({ route }) => {
  const { emp_id } = route.params;
  const navigation = useNavigation();
  const [fw, setFw] = useState([]); // Initialize as an empty array
  const [leave_reasons, setLeaveReasons] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true); // Loading state
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [diagnosis, setDiagnosis] = useState(""); // State for remarks
  const [remarks, setRemarks] = useState(""); // State for remarks
  const [action, setAction] = useState(""); // State for remarks
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [empPhoto, setEmpPhoto] = useState(null);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Helper: fetch signed image URL
  const fetchSignedImage = async (empId) => {
    try {
      const res = await fetch(`${url}/empdata/${empId}/image`, { headers });
      const json = await res.json();
      return json.imageUrl;
    } catch (e) {
      console.error("Failed to fetch signed URL", e);
      return null;
    }
  };

  const formatDate2 = (dateString) => {
    // Check if dateString is a valid string
    if (!dateString || typeof dateString !== "string") {
      return "---"; // Display a placeholder if the input is invalid
    }

    // Split the date and time parts
    const [datePart, timePart] = dateString.split(" ");
    if (!datePart) {
      return "---"; // Display a placeholder if date part is missing
    }

    // Parse the date
    const [month, day, year] = datePart.split("/").map(Number);

    // Create a new Date object
    const date = new Date(year, month - 1, day); // Month is zero-based

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "---"; // Display a placeholder if the date is invalid
    }

    // Format the date as MM/dd/yyyy
    const formattedMonth = String(date.getMonth() + 1).padStart(2, "0");
    const formattedDay = String(date.getDate()).padStart(2, "0");
    const formattedYear = date.getFullYear();

    return `${formattedMonth}/${formattedDay}/${formattedYear}`; // Return the formatted date
  };

  const fetchData = async () => {
    setLoading(true); // Start loading
    const apiUrl = `${url}/employeeftw/confirmmobile?emp_id=${emp_id}`;

    try {
      const response = await fetch(apiUrl, { method: "GET", headers: headers });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const dataValues = data.map((item) => ({
          fw_ref: item.fw_ref,
          employer: item.employer,
          employee_name: item.employee_name,
          department: item.department,
          with_mc: item.with_mc,
          emp_position: item.emp_position,
          leave_reasons: JSON.parse(item.leave_reasons),
        }));
        setFw(dataValues);
        setLeaveReasons(dataValues[0]?.leave_reasons || []); // Safely access leave_reasons

        // Fetch employee photo by emp_id
        if (emp_id) {
          const newUrl = await fetchSignedImage(emp_id);
          setEmpPhoto(newUrl ? newUrl : null);
        }
      } else {
        console.error("No data found or data is not in expected format.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); // Stop loading after the fetch attempt
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(); // Fetch data when the component is focused
    }, [])
  );

  const handleCertifyFTW = () => {
    if (!diagnosis.trim()) {
      // Check if diagnosis is empty
      Alert.alert("Diagnosis Required", "Please provide a diagnosis.");
      return;
    }
    if (!remarks.trim()) {
      // Check if remarks are empty
      Alert.alert("Remarks Required", "Please provide remarks.");
      return;
    }

    Alert.alert(
      "Confirm Certification",
      `Are you sure you want to certify this employee as fit to work?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            setLoading(true);
            const EmployeeFw = {
              Stat: "FW Certified",
              EmpId: emp_id,
              CertifiedBy: getGName(),
              ModifiedBy: getGName(),
              Diagnosis: diagnosis,
              Result: "FIT TO WORK",
              Remarks: remarks,
              DateReturn: date,
            };

            try {
              const response = await fetch(`${url}/employeeftw`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(EmployeeFw),
              });

              if (response.ok) {
                Alert.alert(
                  "Certified Successful",
                  `Fit-to-work certified successfully.`,
                  [{ text: "OK" }]
                );
                navigation.goBack();
              } else {
                console.error("Request failed with status:", response.status);
                const errorContent = await response.text();
                console.error("Error content:", errorContent);
                Alert.alert("Error", "Failed to certify.");
              }
            } catch (error) {
              console.error("Network error:", error);
              Alert.alert("Error", "Network error occurred.");
            } finally {
              setLoading(false);
              setRemarks("");
              setDiagnosis("");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Certify UNFIT
  const handleCertifyUFTW = async () => {
    if (!diagnosis.trim()) {
      // Check if diagnosis is empty
      Alert.alert("Diagnosis Required", "Please provide a diagnosis.");
      return;
    }
    if (!remarks.trim()) {
      // Check if remarks are empty
      Alert.alert("Remarks Required", "Please provide remarks.");
      return;
    }

    // Display confirmation dialog with Yes or Cancel
    Alert.alert(
      "Confirm Certification",
      "Are you sure you want to certify the employee as unfit-to-work?",
      [
        { text: "Cancel", style: "cancel" }, // Cancel action
        {
          text: "Yes",
          onPress: async () => {
            setLoading(true);

            const EmployeeFw = {
              Stat: "FW Certified",
              EmpId: emp_id,
              Diagnosis: diagnosis,
              Result: "UNFIT TO WORK",
              Remarks: remarks,
              CertifiedBy: getGName(),
              ModifiedBy: getGName(),
            };

            try {
              const response = await fetch(`${url}/employeeftw`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(EmployeeFw),
              });

              if (response.ok) {
                Alert.alert(
                  "Certified Successful",
                  "Unfit-to-work result recorded successfully.",
                  [{ text: "OK" }]
                );
                navigation.goBack();
              } else {
                console.error("Request failed with status:", response.status);
                const errorContent = await response.text();
                console.error("Error content:", errorContent);
                Alert.alert("Error", "Failed to certify.");
              }
            } catch (error) {
              console.error("Network error:", error);
              Alert.alert("Error", "Network error occurred.");
            } finally {
              setLoading(false);
              setRemarks("");
              setDiagnosis("");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Loading indicator
  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#0000ff"
        style={styles.loadingIndicator}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Form Header */}
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>FIT TO WORK CERTIFICATE</Text>
        {/*<Text style={styles.formNumber}>{fw[0]?.fw_ref || 'N/A'}</Text>*/}
        <Image
  source={{ uri: empPhoto }}
  style={styles.formImage}
  resizeMode="stretch"
/>

      </View>

      {/* Employer and Department */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Employer:</Text>
          <Text style={styles.text}>{fw[0]?.employer || "N/A"}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.text}>{fw[0]?.department || "N/A"}</Text>
        </View>
      </View>

      {/* Employee Name and Position */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.text}>{fw[0]?.employee_name || "N/A"}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Position:</Text>
          <Text style={styles.text}>{fw[0]?.emp_position || "N/A"}</Text>
        </View>
      </View>

      {/* Med Cert */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Required Medical Certificate:</Text>
          <Text style={styles.text}>{fw[0]?.with_mc || "N/A"}</Text>
        </View>
      </View>

      {/* Leave Reasons Table */}
      <View style={styles.leaveContainer}>
        <Text style={styles.subHeader}>Leave Reason/s</Text>
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeader, styles.tableCell]}>
            Date of Absence
          </Text>
          <Text style={[styles.tableHeader, styles.tableCell]}>
            No. of Days
          </Text>
          <Text style={[styles.tableHeader, styles.tableCell]}>Reason/s</Text>
        </View>

        {Array.isArray(leave_reasons) && leave_reasons.length > 0 ? (
          leave_reasons.map((leave, index) => (
            <View key={index} style={styles.tableRow}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  flex: 1,
                }}
              >
                <Text style={styles.tableCell}>
                  {formatDate2(leave.date_absent_from) ===
                  formatDate2(leave.date_absent_to)
                    ? formatDate2(leave.date_absent_from)
                    : `${formatDate2(leave.date_absent_from)} - ${formatDate2(
                        leave.date_absent_to
                      )}`}
                </Text>

                <Text style={styles.tableCell}>{leave.days}</Text>
                <Text style={styles.tableCell}>{leave.reason}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No leave reasons available.</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Date Return</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{formatDate(date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
              maximumDate={new Date()} // Prevent future dates
            />
          )}
        </View>
      </View>

      <View style={styles.remarksContainer}>
        <TextInput
          style={styles.remarksInput}
          placeholder="Enter diagnosis"
          value={diagnosis}
          onChangeText={setDiagnosis}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TextInput
          style={styles.remarksInput}
          placeholder="Enter remarks"
          value={remarks}
          onChangeText={setRemarks}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => handleCertifyFTW()}
        >
          <Text style={styles.buttonText}>FIT TO WORK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleCertifyUFTW()}
        >
          <Text style={styles.buttonText}>UNFIT TO WORK</Text>
        </TouchableOpacity>
      </View>

      <Spinner
        visible={isLoading}
        textContent={"Loading..."}
        textStyle={{ color: "#FFF" }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formHeader: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  formImage: {
    width: 100,
    height: 80,
    borderRadius: 8, // optional, for rounded corners
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  formNumber: {
    fontSize: 18,
    color: "#777",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontWeight: "bold",
  },
  text: {
    marginTop: 5,
  },
  messageContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  leaveContainer: {
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
  },
  tableHeader: {
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
  },
  noData: {
    textAlign: "center",
    marginVertical: 20,
    color: "#888",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 5,
  },
  rejectButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 5,
  },
  remarksContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  remarksInput: {
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  remarksButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  submitButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
});

export default FittoWorkScreen;
