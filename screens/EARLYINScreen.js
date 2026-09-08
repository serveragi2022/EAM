import React, { useState, useCallback, useEffect } from "react";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { url, headers } from "../api/httpclient";
import { getGName } from "../GlobalVariable";
import Spinner from "react-native-loading-spinner-overlay";
import DateTimePicker from "@react-native-community/datetimepicker";

const EARLYINScreen = ({ route }) => {
  const { department, department_code, lst_id, date } = route.params;
  const navigation = useNavigation();
  const [lst, setLst] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [earlyInTime, setEarlyInTime] = useState(""); // formatted string "HH:mm"
  const [reason, setReason] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false); // toggle for clock
  const [empPhoto, setEmpPhoto] = useState(null);

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      setEarlyInTime(`${hours}:${minutes}`);
    }
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

  const formatDateYYYYMMDD = (dateStr) => {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${year}/${month}/${day}`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const formattedDate = formatDateYYYYMMDD(date);
      const response = await fetch(
        `${url}/employeeschedule/earlyin/confirm?lst_id=${lst_id}&date=${formattedDate}`,
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

        if (data[0].emp_id) {
          const newUrl = await fetchSignedImage(data[0].emp_id);
          setEmpPhoto(newUrl ? newUrl : null);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirm = async () => {
    // ✅ Validate
    if (!earlyInTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
      Alert.alert("Invalid Time", "Please enter time in HH:mm format.");
      return;
    }

    if (!reason || reason.trim() === "") {
      Alert.alert(
        "Missing Reason",
        "Please provide a valid justification for the early-in."
      );
      return;
    }

    Alert.alert(
      "Confirm Add Early-In",
      "Are you sure you want to confirm adding the employee early-in?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            setIsLoading(true);
            const EmployeeScheduleList = {
              LstId: lst_id,
              ModifiedBy: getGName(),
              Day1IsEarlyin: lst[0].day == "Day1" ? true : null,
              Day2IsEarlyin: lst[0].day == "Day2" ? true : null,
              Day3IsEarlyin: lst[0].day == "Day3" ? true : null,
              Day4IsEarlyin: lst[0].day == "Day4" ? true : null,
              Day5IsEarlyin: lst[0].day == "Day5" ? true : null,
              Day6IsEarlyin: lst[0].day == "Day6" ? true : null,
              Day7IsEarlyin: lst[0].day == "Day7" ? true : null,
              Day1IsEarlyinTime: lst[0].day == "Day1" ? earlyInTime : null,
              Day2IsEarlyinTime: lst[0].day == "Day2" ? earlyInTime : null,
              Day3IsEarlyinTime: lst[0].day == "Day3" ? earlyInTime : null,
              Day4IsEarlyinTime: lst[0].day == "Day4" ? earlyInTime : null,
              Day5IsEarlyinTime: lst[0].day == "Day5" ? earlyInTime : null,
              Day6IsEarlyinTime: lst[0].day == "Day6" ? earlyInTime : null,
              Day7IsEarlyinTime: lst[0].day == "Day7" ? earlyInTime : null,
              Day1EarlyinReasonJustification:
                lst[0].day == "Day1" ? reason : null,
              Day2EarlyinReasonJustification:
                lst[0].day == "Day2" ? reason : null,
              Day3EarlyinReasonJustification:
                lst[0].day == "Day3" ? reason : null,
              Day4EarlyinReasonJustification:
                lst[0].day == "Day4" ? reason : null,
              Day5EarlyinReasonJustification:
                lst[0].day == "Day5" ? reason : null,
              Day6EarlyinReasonJustification:
                lst[0].day == "Day6" ? reason : null,
              Day7EarlyinReasonJustification:
                lst[0].day == "Day7" ? reason : null,
            };

            try {
              const response = await fetch(`${url}/employeeschedule/earlyin`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(EmployeeScheduleList),
              });
              if (response.ok) {
                Alert.alert("Success", "Added Early-In successfully.");
                navigation.goBack();
              } else {
                Alert.alert("Error", "Failed to add Early-In.");
              }
            } catch (error) {
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
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formHeader}>
        <Image
          source={{ uri: empPhoto }}
          style={styles.formImage}
          resizeMode="stretch"
        />
      </View>

      {/* Info Rows */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.dataText}>{lst[0]?.employee_name || "N/A"}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.dataText}>{lst[0]?.department_code || "N/A"}</Text>
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

      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.dataText}>{lst[0]?.date || "N/A"}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Schedule:</Text>
          <Text style={styles.dataText}>{lst[0]?.schedule || "N/A"}</Text>
        </View>
      </View>

      {/* Early-In Time Input */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.label}>Early-In Time:</Text>
        <TouchableOpacity
          style={[styles.input, { justifyContent: "center" }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={{ fontSize: 16 }}>
            {earlyInTime ? earlyInTime : "Select Time"}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            mode="time"
            value={new Date()}
            is24Hour={true}
            display="clock"
            onChange={onTimeChange}
          />
        )}
      </View>

      {/* Reason/Justification Input */}
      <View>
        <Text style={styles.label}>Reason/Justification:</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={reason}
          onChangeText={handleReasonChange}
          placeholder="Enter reason/justification"
        />
      </View>
      {/* Confirm Button */}
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
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f5f5f5" },
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  labelContainer: { flex: 1 },
  label: { fontSize: 16, fontWeight: "bold", color: "#555" },
  dataText: { fontSize: 16, color: "#333", marginTop: 5 },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    marginTop: 5,
  },
  buttonContainer: { marginTop: 20 },
  flatButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
});

export default EARLYINScreen;
