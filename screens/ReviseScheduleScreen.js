import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { url, headers } from "../api/httpclient";
import { getGName } from "../GlobalVariable";
import Spinner from "react-native-loading-spinner-overlay";
import { Dropdown } from "react-native-element-dropdown";

const ReviseScheduleScreen = ({ route }) => {
  const { lst_id, department } = route.params;

  const navigation = useNavigation();
  const [lst, setLst] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [day1escode, setday1escode] = useState(null);
  const [day2escode, setday2escode] = useState(null);
  const [day3escode, setday3escode] = useState(null);
  const [day4escode, setday4escode] = useState(null);
  const [day5escode, setday5escode] = useState(null);
  const [day6escode, setday6escode] = useState(null);
  const [day7escode, setday7escode] = useState(null);
  const [escodeOptions, setescodeoption] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [assignedlocation, setAssignedLocation] = useState("");
  const [reason, setReason] = useState("");
  const [empPhoto, setEmpPhoto] = useState(null);
  const [withReliever, setWithReliever] = useState("");

  const UNSCHEDULES = [
    "HD",
    "SO",
    "EL",
    "BL",
    "VL",
    "SL",
    "ML",
    "PL",
    "NA",
    "SD",
    "RD",
  ];

  const UNSCHEDULESReliever = ["EL", "BL", "VL", "SL", "ML", "PL", "NA", "SD"];

  const isRelieverEnabled = [
    day1escode,
    day2escode,
    day3escode,
    day4escode,
    day5escode,
    day6escode,
    day7escode,
  ].some((day) => {
    if (!day) return false; // skip empty/null
    return UNSCHEDULESReliever.includes(day.trim().toUpperCase());
  });

  const requiredStyle = { color: "red" };

  const getDropdownStyle = (value) => [
    styles.dropdown,
    UNSCHEDULES.includes(value) && styles.yellowDropdown,
  ];

  const getTotalHoursByEsCode = async (escode) => {
    if (!escode) return 0;

    try {
      const response = await fetch(`${url}/eschedule/hours?escode=${escode}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) throw new Error("Failed to fetch hours");

      const data = await response.json();
      return data?.total_hours || 0;
    } catch (error) {
      console.error("Hours fetch error:", error);
      return 0;
    }
  };

  const relieverOptions = [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
  ];

  const validateWeeklyHours = async (codes) => {
    const hours = await Promise.all(
      codes.map((code) => getTotalHoursByEsCode(code))
    );

    const totalHours = hours.reduce((sum, h) => sum + h, 0);

    if (totalHours > 48) {
      Alert.alert(
        "Validation Error",
        `Total weekly hours (${totalHours}) must not exceed 48 hours.`
      );
      return false;
    }

    return true;
  };

  const formatDateMMDDYYYY = (value) => {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date)) return "";

    const month = String(date.getMonth() + 1).padStart(2, "0");
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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${url}/employeeschedule/mobile/revise?lst_id=${lst_id}`,
        {
          method: "GET",
          headers: headers,
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setLst(data);
        setday1escode(data[0].day1_escode || null);
        setday2escode(data[0].day2_escode || null);
        setday3escode(data[0].day3_escode || null);
        setday4escode(data[0].day4_escode || null);
        setday5escode(data[0].day5_escode || null);
        setday6escode(data[0].day6_escode || null);
        setday7escode(data[0].day7_escode || null);
        setAssignedLocation(data[0].assigned_location || "");
        setRemarks(data[0].es_remarks || "");
        setWithReliever(data[0].with_reliever || "");
        // Fetch employee photo by emp_id
        if (data[0].emp_id) {
          const newUrl = await fetchSignedImage(data[0].emp_id);
          setEmpPhoto(newUrl ? newUrl : null);
        }
      }

      const response1 = await fetch(
        `${url}/eschedule?department=${encodeURIComponent(department)}`,
        {
          method: "GET",
          headers: headers,
        }
      );
      if (!response1.ok) throw new Error("Failed to fetch data");

      const data1 = await response1.json();
      if (Array.isArray(data1) && data1.length > 0) {
        const schedules = data1;
        setescodeoption(
          schedules.map((item) => ({
            label: item.es_code,
            value: item.es_code,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
  if (!isRelieverEnabled) {
    setWithReliever(""); // Clear value when disabled
  }
}, [isRelieverEnabled]);


  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirm = async () => {
    // --- VALIDATION --- //
    const schedules = [
      day1escode,
      day2escode,
      day3escode,
      day4escode,
      day5escode,
      day6escode,
      day7escode,
    ];

    const isValid = await validateWeeklyHours(schedules);
    if (!isValid) return;

    if (schedules.some((code) => !code || code.trim() === "")) {
      Alert.alert(
        "Missing Schedule",
        "Please select a schedule for all days before proceeding."
      );
      return;
    }

    if (
      isRelieverEnabled === true &&
      (!withReliever || withReliever.trim() === "")
    ) {
      Alert.alert(
        "Missing With Reliever",
        "Please specify if there is a reliever assigned."
      );
      return;
    }

    if (!reason || reason.trim() === "") {
      Alert.alert(
        "Missing Reason",
        "Please provide a reason for the revision of schedule."
      );
      return;
    }

    Alert.alert(
      "Confirm Revision",
      "Are you sure you want to confirm revise the employee schedule?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            setIsLoading(true);
            const EmployeeScheduleList = {
              LstId: lst_id,
              ModifiedBy: getGName(),
              Day1Escode: day1escode,
              Day2Escode: day2escode,
              Day3Escode: day3escode,
              Day4Escode: day4escode,
              Day5Escode: day5escode,
              Day6Escode: day6escode,
              Day7Escode: day7escode,
              EsRemarks: remarks,
              WithReliever:
                isRelieverEnabled === true ? withReliever === "Yes" : null,
              AssignedLocation: assignedlocation,
              Day1OtReasonJustification: reason,
              ModifiedBy: getGName(),
            };
            try {
              const response = await fetch(
                `${url}/employeeschedule/mobile/revise`,
                {
                  method: "PUT",
                  headers: headers,
                  body: JSON.stringify(EmployeeScheduleList),
                }
              );
              if (response.ok) {
                Alert.alert(
                  "Confirm Successful",
                  "Schedule revised successfully.",
                  [{ text: "OK" }]
                );
                navigation.goBack();
              } else {
                console.error("Request failed:", response.status);
                Alert.alert("Error", "Failed to add.");
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
      { cancelable: false }
    );
  };

  const handleReasonChange = (text) => {
    console.log("Text changed:", text); // <— Add this
    setReason(text);
  };

  const handleRemarksChange = (text) => {
    console.log("Text changed:", text); // <— Add this
    setRemarks(text);
  };

  const handleAssignedLocationChange = (text) => {
    console.log("Text changed:", text); // <— Add this
    setAssignedLocation(text);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formHeader}>
        <Image
          source={{ uri: empPhoto }}
          style={styles.formImage}
          resizeMode="stretch"
        />
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.dataText}>{lst[0]?.employee_name || "N/A"}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.dataText}>
            {lst[0]?.department_code || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Employer:</Text>
          <Text style={styles.dataText}>{lst[0]?.employer || "N/A"}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Position:</Text>
          <Text style={styles.dataText}>{lst[0]?.emp_position || "N/A"}</Text>
        </View>
      </View>

      <View>
        <Text style={styles.label}>
          Monday ({formatDateMMDDYYYY(lst[0]?.day1_date) || "N/A"}){" "}
          <Text style={requiredStyle}>*</Text>
        </Text>
        <Dropdown
          style={getDropdownStyle(day1escode)}
          data={escodeOptions}
          labelField="label"
          valueField="value"
          placeholder="Select an option"
          search
          searchPlaceholder="Type to search..."
          value={day1escode}
          onChange={(item) => setday1escode(item.value)}
        />
      </View>

      <View>
        <Text style={styles.label}>
          Tuesday ({formatDateMMDDYYYY(lst[0]?.day2_date) || "N/A"}){" "}
          <Text style={requiredStyle}>*</Text>
        </Text>
        <Dropdown
          style={getDropdownStyle(day2escode)}
          data={escodeOptions}
          labelField="label"
          valueField="value"
          placeholder="Select an option"
          search
          searchPlaceholder="Type to search..."
          value={day2escode}
          onChange={(item) => setday2escode(item.value)}
        />
      </View>

      <View>
        <Text style={styles.label}>
          Wednesday ({formatDateMMDDYYYY(lst[0]?.day3_date) || "N/A"}){" "}
          <Text style={requiredStyle}>*</Text>
        </Text>
        <Dropdown
          style={getDropdownStyle(day3escode)}
          data={escodeOptions}
          labelField="label"
          valueField="value"
          placeholder="Select an option"
          search
          searchPlaceholder="Type to search..."
          value={day3escode}
          onChange={(item) => setday3escode(item.value)}
        />
      </View>

      <View>
        <Text style={styles.label}>
          Thursday ({formatDateMMDDYYYY(lst[0]?.day4_date) || "N/A"}){" "}
          <Text style={requiredStyle}>*</Text>
        </Text>
        <Dropdown
          style={getDropdownStyle(day4escode)}
          data={escodeOptions}
          labelField="label"
          valueField="value"
          placeholder="Select an option"
          search
          searchPlaceholder="Type to search..."
          value={day4escode}
          onChange={(item) => setday4escode(item.value)}
        />
      </View>

      <View>
        <Text style={styles.label}>
          Friday ({formatDateMMDDYYYY(lst[0]?.day5_date) || "N/A"}){" "}
          <Text style={requiredStyle}>*</Text>
        </Text>
        <Dropdown
          style={getDropdownStyle(day5escode)}
          data={escodeOptions}
          labelField="label"
          valueField="value"
          placeholder="Select an option"
          search
          searchPlaceholder="Type to search..."
          value={day5escode}
          onChange={(item) => setday5escode(item.value)}
        />
      </View>

      <View>
        <Text style={styles.label}>
          Saturday ({formatDateMMDDYYYY(lst[0]?.day6_date) || "N/A"}){" "}
          <Text style={requiredStyle}>*</Text>
        </Text>
        <Dropdown
          style={getDropdownStyle(day6escode)}
          data={escodeOptions}
          labelField="label"
          valueField="value"
          placeholder="Select an option"
          search
          searchPlaceholder="Type to search..."
          value={day6escode}
          onChange={(item) => setday6escode(item.value)}
        />
      </View>

      <View>
        <Text style={styles.label}>
          Sunday ({formatDateMMDDYYYY(lst[0]?.day7_date) || "N/A"}){" "}
          <Text style={requiredStyle}>*</Text>
        </Text>
        <Dropdown
          style={getDropdownStyle(day7escode)}
          data={escodeOptions}
          labelField="label"
          valueField="value"
          placeholder="Select an option"
          search
          searchPlaceholder="Type to search..."
          value={day7escode}
          onChange={(item) => setday7escode(item.value)}
        />
      </View>

      <View>
        <Text style={styles.label}>With Reliever</Text>
        <Dropdown
          style={[
            styles.dropdown,
            !isRelieverEnabled && styles.dropdownDisabled, // apply shaded style when disabled
          ]}
          data={relieverOptions}
          labelField="label"
          valueField="value"
          placeholder=""
          value={withReliever}
          onChange={(item) => setWithReliever(item.value)}
          disable={!isRelieverEnabled}
        />
      </View>

      {/* Assigned Location Input */}
      <View>
        <Text style={styles.label}>Assigned Location:</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={assignedlocation}
          onChangeText={handleAssignedLocationChange}
          placeholder="Enter assigned location"
        />
      </View>

      {/* Remarks Input */}
      <View>
        <Text style={styles.label}>Remarks:</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={remarks}
          onChangeText={handleRemarksChange}
          placeholder="Enter remarks"
        />
      </View>

      {/* Reason Input */}
      <View>
        <Text style={styles.label}>
          Reason for Revision:
          <Text style={requiredStyle}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={reason}
          onChangeText={handleReasonChange}
          placeholder="Enter reason"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.flatButton} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm</Text>
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
    backgroundColor: "#f5f5f5",
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
  formNumber: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  labelContainer: { flex: 1 },
  label: { fontSize: 16, fontWeight: "bold", color: "#555" },
  dataText: {
    fontSize: 16,
    color: "#333",
    marginTop: 5,
  },
  dropdown: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  dropdown1: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  flatButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    marginTop: 5,
  },
  yellowDropdown: {
    backgroundColor: "#FFD54F", // yellow
    borderColor: "#FFC107",
  },
  dropdownDisabled: { backgroundColor: "#f0f0f0", borderColor: "#ccc" }, // shaded gray
});

export default ReviseScheduleScreen;
