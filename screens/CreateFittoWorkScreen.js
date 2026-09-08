import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { url, headers } from "../api/httpclient";
import { getGName } from "../GlobalVariable";
import { useNavigation } from "@react-navigation/native";
import Spinner from "react-native-loading-spinner-overlay";
import Checkbox from "expo-checkbox";

export default function CreateFitToWorkScreen({ route }) {
  const { item } = route.params;
  const navigation = useNavigation();

  const employer = item?.employer || "";
  const employeeName = item?.employee_name || "";
  const department = item?.department || "";
  const position = item?.position || "";
  const hold_id = item?.hold_id || "";

    const [isLoading, setIsLoading] = useState(false);
    const [requireMedicalCert, setRequireMedicalCert] = useState(false);
  const [fitToWorkDate, setFitToWorkDate] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [leaveReasons, setLeaveReasons] = useState([]);
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [showLeaveDatePicker, setShowLeaveDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState(null);

  const formatDate = (date) =>
    date ? date.toISOString().split("T")[0] : "Select Date";
  const formatDate1 = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
      .getDate()
      .toString()
      .padStart(2, "0")}/${d.getFullYear()} 00:00:00`;
  };

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    return Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleFitToWorkDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setFitToWorkDate(selectedDate);
  };

  const handleLeaveDateChange = (event, selectedDate) => {
    setShowLeaveDatePicker(false);
    if (selectedDate) {
      if (dateMode === "from") {
        setFromDate(selectedDate);
      } else if (dateMode === "to") {
        if (fromDate && selectedDate < fromDate) {
          Alert.alert(
            "Invalid Date",
            "To Date cannot be earlier than From Date."
          );
        } else {
          setToDate(selectedDate);
        }
      }
    }
  };

  const addLeaveReason = () => {
    if (!fromDate || !toDate || !reason.trim()) {
      Alert.alert("Validation Error", "Please fill all fields before adding.");
      return;
    }

    const daysAbsent = calculateDays(fromDate, toDate);

    const newLeave = {
      id: Math.random().toString(),
      date_absent_from: formatDate1(fromDate),
      date_absent_to: formatDate1(toDate),
      days: daysAbsent,
      reason: reason.trim(),
    };

    setLeaveReasons([...leaveReasons, newLeave]);
    setFromDate(null);
    setToDate(null);
    setReason("");
  };

  // Validate Before Submitting Back to Work Form
  const handleSubmit = async () => {
    if (!fitToWorkDate) {
      Alert.alert("Validation Error", "Please select a Date of Return.");
      return;
    }
    if (leaveReasons.length === 0) {
      Alert.alert("Validation Error", "Please add at least one leave entry.");
      return;
    }
 
    // Show confirmation alert before proceeding
    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to submit this form?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Submit",
          onPress: async () => {
            try {
              setIsLoading(true);
              // Format Leave Reasons
              const formattedLeaveReasons = leaveReasons.map((item) => ({
                date_absent_from: item.date_absent_from,
                date_absent_to: item.date_absent_to,
                days: item.days,
                reason: item.reason,
              }));

              const jsonStringLeaveReasons = JSON.stringify(
                formattedLeaveReasons
              );
              // Prepare API payload
              const EmployeeFw = {
                FwId: hold_id,
                Stat: "FW Requested",
                LeaveReasons: jsonStringLeaveReasons,
                DateReturn: formatDate1(fitToWorkDate),
                CreatedBy: getGName(),
                WithMc: requireMedicalCert,
              };
              const response = await fetch(`${url}/employeeftw`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(EmployeeFw),
              });
              if (response.ok) {
                Alert.alert(
                  "Success",
                  "Fit to Work Form submitted successfully!"
                );
                navigation.goBack();
              } else {
                Alert.alert(
                  "Error",
                  "Failed to submit Fit to Work form. Try again."
                );
              }
            } catch (error) {
              Alert.alert("Error", "Network error. Check your connection.");
            }
            finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    
    <View marginLeft={10} marginRight={10}>
      <Text style={styles.header}>Fit to Work Form</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Employer: {employer}</Text>
        <Text style={styles.label}>Employee Name: {employeeName}</Text>
        <Text style={styles.label}>Department: {department}</Text>
        <Text style={styles.label}>Position: {position}</Text>
      </View>

      <View style={styles.checkboxContainer}>
        <Checkbox
          value={requireMedicalCert}
          onValueChange={(newValue) => setRequireMedicalCert(newValue)}
          color={requireMedicalCert ? "#007bff" : undefined}
        />
        <Text style={styles.labelCheckbox}>Require Medical Certificate</Text>
      </View>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#fff" />
        <Text style={styles.dateText}>
          {fitToWorkDate ? formatDate(fitToWorkDate) : "Select Date of Return"}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={fitToWorkDate || new Date()}
          mode="date"
          display="default"
          onChange={handleFitToWorkDateChange}
        />
      )}

      <Text style={styles.subHeader}>Leave Reasons</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => {
            setDateMode("from");
            setShowLeaveDatePicker(true);
          }}
        >
          <Text>{formatDate(fromDate) == "Select Date" ? "Select Date of Absence From" : formatDate(fromDate)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => {
            setDateMode("to");
            setShowLeaveDatePicker(true);
          }}
        >
          <Text>{formatDate(toDate) == "Select Date" ? "Select Date of Absence To" : formatDate(toDate)}</Text>
        </TouchableOpacity>
      </View>

      {showLeaveDatePicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display="default"
          onChange={handleLeaveDateChange}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter Leave Reason"
        value={reason}
        onChangeText={setReason}
      />

      <TouchableOpacity style={styles.addButton} onPress={addLeaveReason}>
        <Text style={styles.addButtonText}>+ Add Leave</Text>
      </TouchableOpacity>

      <View style={styles.gridContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, { flex: 1 }]}>From</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>To</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Days</Text>
          <Text style={[styles.headerCell, { flex: 2 }]}>Reason</Text>
          <Text style={[styles.headerCell, { flex: 1, textAlign: "center" }]}>
            Action
          </Text>
        </View>

        <FlatList
          data={leaveReasons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listRow}>
              <Text style={[styles.cellText, { flex: 1 }]}>
                {item.date_absent_from.substring(0, 10)}
              </Text>
              <Text style={[styles.cellText, { flex: 1 }]}>
                {item.date_absent_to.substring(0, 10)}
              </Text>
              <Text style={[styles.cellText, { flex: 1, textAlign: "center" }]}>
                {item.days}
              </Text>
              <Text style={[styles.cellText, { flex: 2 }]}>{item.reason}</Text>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { flex: .6, alignItems: "center" },
                ]}
                onPress={() =>
                  setLeaveReasons(leaveReasons.filter((l) => l.id !== item.id))
                }
               
              >
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
              
            </View>
          )}


  ListFooterComponent={() => (
    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
      <Text style={styles.submitText}>Submit</Text>
    </TouchableOpacity>
  )}
        />
      </View>

      <Spinner
        visible={isLoading}
        textContent={"Loading..."}
        textStyle={{ color: "#FFF" }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: "#f9f9f9",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10, // Increase spacing
  },
  dateButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
    width: "100%",
  },
  dateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  selectedDate: {
    textAlign: "center",
    marginVertical: 12, // More space
    fontSize: 16,
    color: "gray",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10, // Added margin
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15, // More spacing
  },
  dateInput: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 8,
    textAlign: "center",
    backgroundColor: "#fff",
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10, // Increase space
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    padding: 14, // Bigger padding
    borderRadius: 10,
    marginVertical: 10, // More spacing
    backgroundColor: "#fff",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20, // More space
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#007bff", // Blue color
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20, // Give space so it's visible
    width: "100%",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  gridContainer: { marginTop: 20, paddingHorizontal: 10 },

  // Header Styling
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  // Data Row Styling
  listRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },
  cellText: {
    fontSize: 14,
    textAlign: "center",
  },

  // Delete Button Styling
  actionButton: {
    padding: 5,
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    marginLeft: 20,
  },
  labelCheckbox: {
    fontSize: 16,
    marginLeft: 8,
  },
});
