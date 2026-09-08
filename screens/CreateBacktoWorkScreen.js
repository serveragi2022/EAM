import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { url, headers } from "../api/httpclient";
import { getGName } from "../GlobalVariable";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Spinner from "react-native-loading-spinner-overlay";

export default function CreateBackToWorkScreen({ route }) {
  const { item } = route.params;
  const navigation = useNavigation();
  // Ensure `item` exists before accessing properties
  const employer = item?.employer || "";
  const employeeName = item?.employee_name || "";
  const department = item?.department || "";
  const position = item?.position || "";
  const hold_id = item?.hold_id || "";

  // Date states (Initially empty)
    const [isLoading, setIsLoading] = useState(false);
  const [backToWorkDate, setBackToWorkDate] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // UI States
  const [showPicker, setShowPicker] = useState(false);
  const [showLeaveDatePicker, setShowLeaveDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState(null);

  // Leave reason states
  const [leaveReasons, setLeaveReasons] = useState([]);
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");

  const leaveTypes = ["BL", "EL", "ML", "PL", "SL", "VL"];

  const formatDate = (date) =>
    date ? date.toISOString().split("T")[0] : "Select Date";
  const formatDate1 = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0"); // Ensure MM format
    const day = d.getDate().toString().padStart(2, "0"); // Ensure DD format
    const year = d.getFullYear();
    return `${month}/${day}/${year} 00:00:00`;
  };
  // Handle Date of Back to Work Selection
  const handleBackToWorkDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setBackToWorkDate(selectedDate);
  };

  // Handle Leave Date Selection
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

  // Validate Before Adding Leave Entry
  const addLeaveReason = () => {
    if (!fromDate || !toDate || !type || !reason.trim()) {
      Alert.alert(
        "Validation Error",
        "All fields must be filled before adding."
      );
      return;
    }

    const newLeave = {
      id: Math.random().toString(),
      date_absent_from: formatDate1(fromDate),
      date_absent_to: formatDate1(toDate),
      type,
      reason: reason.trim(),
    };

    setLeaveReasons([...leaveReasons, newLeave]); // Update the state
    setFromDate(null);
    setToDate(null);
    setType("");
    setReason("");
  };

  // Validate Before Submitting Back to Work Form
  const handleSubmit = async () => {
    if (!backToWorkDate) {
      Alert.alert("Validation Error", "Please select a Date of Back to Work.");
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
                type: item.type,
                reason: item.reason,
              }));

              const jsonStringLeaveReasons = JSON.stringify(
                formattedLeaveReasons
              );
              // Prepare API payload
              const EmployeeBw = {
                BwId: hold_id,
                Stat: "BW Requested",
                LeaveReasons: jsonStringLeaveReasons,
                DateBw: formatDate1(backToWorkDate),
                CreatedBy: getGName(),
              };

              const response = await fetch(`${url}/employeebtw`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(EmployeeBw),
              });
              if (response.ok) {
                Alert.alert(
                  "Success",
                  "Back to Work Form submitted successfully!"
                );
                navigation.goBack();
              } else {
                Alert.alert(
                  "Error",
                  "Failed to submit Back to Work form. Try again."
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
      <Text style={styles.header}>Back to Work Form</Text>

      {/* Employee Details */}
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Employer: {employer}</Text>
        <Text style={styles.label}>Employee Name: {employeeName}</Text>
        <Text style={styles.label}>Department: {department}</Text>
        <Text style={styles.label}>Position: {position}</Text>
      </View>

      {/* Date Picker for Back to Work */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#fff" />
        <Text style={styles.dateText}>
          {backToWorkDate
            ? formatDate(backToWorkDate)
            : "Select Date of Back to Work"}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={backToWorkDate || new Date()}
          mode="date"
          display="default"
          onChange={handleBackToWorkDateChange}
        />
      )}

      {/* Leave Entry */}
      <Text style={styles.subHeader}>Leave Reasons</Text>

      {/* Leave Date Pickers */}
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

      {/* Type Dropdown */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={type}
          onValueChange={(itemValue) => setType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Type" value="" />
          {leaveTypes.map((typeOption) => (
            <Picker.Item
              key={typeOption}
              label={typeOption}
              value={typeOption}
            />
          ))}
        </Picker>
      </View>

      {/* Reason Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter Leave Reason"
        value={reason}
        onChangeText={setReason}
      />

      {/* Add Leave Button */}
      <TouchableOpacity style={styles.addButton} onPress={addLeaveReason}>
        <Text style={styles.addButtonText}>+ Add Leave</Text>
      </TouchableOpacity>

      {/* Leave Reasons List as a Grid */}
      <View style={styles.gridContainer}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, { flex: 1 }]}>From</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>To</Text>
          <Text style={[styles.headerCell, { flex: 1 }]}>Type</Text>
          <Text style={[styles.headerCell, { flex: 2 }]}>Reason</Text>
           <Text style={[styles.headerCell, { flex: 1, textAlign: "center" }]}>
            Action
          </Text>
        </View>

        {/* Data Rows */}
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
              <Text style={[styles.cellText, { flex: 1 }]}>{item.type}</Text>
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
});
