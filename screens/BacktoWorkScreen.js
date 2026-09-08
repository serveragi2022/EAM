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
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { url, headers } from "../api/httpclient";
import { getGName } from "../GlobalVariable";
import Spinner from "react-native-loading-spinner-overlay";

const BacktoWorkScreen = ({ route }) => {
  const { hold_id } = route.params;
  const navigation = useNavigation();
  const [bw, setBw] = useState([]); // Initialize as an empty array
  const [leave_reasons, setLeaveReasons] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true); // Loading state
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [remarks, setRemarks] = useState(""); // State for remarks
  const [showRemarksInput, setShowRemarksInput] = useState(false); // State for displaying remarks input

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDate2 = (dateString) => {
    // Check if dateString is a valid string
    if (!dateString || typeof dateString !== 'string') {
      return '---'; // Display a placeholder if the input is invalid
    }
  
    // Split the date and time parts
    const [datePart, timePart] = dateString.split(" ");
    if (!datePart) {
      return '---'; // Display a placeholder if date part is missing
    }
  
    // Parse the date
    const [month, day, year] = datePart.split("/").map(Number);
  
    // Create a new Date object
    const date = new Date(year, month - 1, day); // Month is zero-based
  
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return '---'; // Display a placeholder if the date is invalid
    }
  
    // Format the date as MM/dd/yyyy
    const formattedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(date.getDate()).padStart(2, '0');
    const formattedYear = date.getFullYear();
  
    return `${formattedMonth}/${formattedDay}/${formattedYear}`; // Return the formatted date
  };
  

  const fetchData = async () => {
    setLoading(true); // Start loading
    const apiUrl = `${url}/employeebtw/confirmmobile?bw_id=${hold_id}`;

    try {
      const response = await fetch(apiUrl, { method: "GET", headers: headers });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const dataValues = data.map((item) => ({
          bw_ref: item.bw_ref,
          employer: item.employer,
          employee_name: item.employee_name,
          department: item.department,
          date_bw: formatDate(item.date_bw),
          shift_bw: item.shift_bw,
          emp_position: item.emp_position,
          leave_reasons: JSON.parse(item.leave_reasons), // Ensure it's an array
        }));
        setBw(dataValues);
        setLeaveReasons(dataValues[0]?.leave_reasons || []); // Safely access leave_reasons
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

  const handleConfirm = (item) => {
    Alert.alert(
      'Confirm',
      `Are you sure you want to confirm this employee back to work form?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            setLoading(true);
            const EmployeeBw = {
              Stat: 'BW Confirmed',
              BwId: hold_id,
              ConfirmedBy: getGName(),
              ModifiedBy: getGName(),
            };

            try {
              const response = await fetch(`${url}/employeebtw`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(EmployeeBw),
              });

              if (response.ok) {
                Alert.alert(
                  'Confirmed Successful',
                  `The Back-to-work was confirmed successfully.`,
                  [{ text: 'OK' }]
                );
                navigation.goBack();
              } else {
                console.error("Request failed with status:", response.status);
                const errorContent = await response.text();
                console.error("Error content:", errorContent);
                Alert.alert("Error", "Failed to un-hold.");
              }
            } catch (error) {
              console.error("Network error:", error);
              Alert.alert("Error", "Network error occurred.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Reject Handler with Remarks
  const handleReject = async () => {
    if (!remarks.trim()) { // Check if remarks are empty
      Alert.alert('Remarks Required', 'Please provide a reason for rejection.');
      return;
    }
    setLoading(true);

    const EmployeeBw = {
      Stat: 'BW Rejected',
      BwId: hold_id,
      CancelledReason: remarks,
      RejectedBy: getGName(),
      ModifiedBy: getGName(),
    };

    try {
      const response = await fetch(`${url}/employeebtw`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(EmployeeBw),
      });

      if (response.ok) {
        Alert.alert(
          'Rejected Successful',
          `The back-to-work form was rejected successfully.`,
          [{ text: 'OK' }]
        );
        navigation.goBack();
      } else {
        console.error("Request failed with status:", response.status);
        const errorContent = await response.text();
        console.error("Error content:", errorContent);
        Alert.alert("Error", "Failed to un-hold.");
      }
    } catch (error) {
      console.error("Network error:", error);
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setLoading(false);
      setShowRemarksInput(false); // Close the remarks input after submission
      setRemarks(""); // Reset remarks input
    }
  };

  // Loading indicator
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Form Header */}
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>BACK TO WORK FORM</Text>
        <Text style={styles.formNumber}>{bw[0]?.bw_ref || 'N/A'}</Text>
      </View>

      {/* Employer and Department */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Employer:</Text>
          <Text style={styles.text}>{bw[0]?.employer || 'N/A'}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.text}>{bw[0]?.department || 'N/A'}</Text>
        </View>
      </View>

      {/* Employee Name and Position */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.text}>{bw[0]?.employee_name || 'N/A'}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Position:</Text>
          <Text style={styles.text}>{bw[0]?.emp_position || 'N/A'}</Text>
        </View>
      </View>

      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>
          To Whom It May Concern, Kindly allow our employee/member to go back to
          work effective:
        </Text>
      </View>

      {/* Date and Shift */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.text}>{bw[0]?.date_bw || 'N/A'}</Text>
        </View>
      </View>

      {/* Leave Reasons Table */}
      <View style={styles.leaveContainer}>
        <Text style={styles.subHeader}>Leave Reason/s</Text>
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeader, styles.tableCell]}>Date of Absence</Text>
          <Text style={[styles.tableHeader, styles.tableCell]}>Type</Text>
          <Text style={[styles.tableHeader, styles.tableCell]}>Reason/s</Text>
        </View>

        {Array.isArray(leave_reasons) && leave_reasons.length > 0 ? leave_reasons.map((leave, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
              <Text style={styles.tableCell}>{formatDate2(leave.date_absent_from) + ' - ' + formatDate2(leave.date_absent_to)}</Text>
              <Text style={styles.tableCell}>{leave.type}</Text>
              <Text style={styles.tableCell}>{leave.reason}</Text>
            </View>
          </View>
        )) : (
          <Text style={styles.noData}>No leave reasons available.</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => handleConfirm(bw[0])}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => setShowRemarksInput(true)} // Show remarks input on reject
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>

      {/* Remarks Input Modal */}
      {showRemarksInput && (
        <View style={styles.remarksContainer}>
          <TextInput
            style={styles.remarksInput}
            placeholder="Enter remarks for rejection"
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <View style={styles.remarksButtonContainer}>
            <TouchableOpacity style={styles.submitButton} onPress={handleReject}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowRemarksInput(false); // Close the input
                setRemarks(""); // Reset remarks input
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        
      )}

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
    backgroundColor: '#f2f2f2',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formNumber: {
    fontSize: 18,
    color: '#777',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
  },
  text: {
    marginTop: 5,
  },
  messageContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  leaveContainer: {
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  tableHeader: {
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  noData: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#888',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 5,
  },
  remarksContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  remarksInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  remarksButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default BacktoWorkScreen;
