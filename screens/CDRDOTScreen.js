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
import { Dropdown } from "react-native-element-dropdown";

const CDRDOTScreen = ({ route }) => {
  const { department, department_code, lst_id, date } = route.params;

  const navigation = useNavigation();
  const [lst, setLst] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overtimeSchedule, setOvertimeSchedule] = useState(null);
  const [overtimeOptions, setOvertimeOptions] = useState([]);
  const [reason, setReason] = useState("");
  const [empPhoto, setEmpPhoto] = useState(null);

  const formatDateYYYYMMDD = (dateStr) => {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${year}/${month}/${day}`;
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
      const formattedDate = formatDateYYYYMMDD(date);
      const response = await fetch(
        `${url}/employeeschedule/cdrdot/confirm?lst_id=${lst_id}&date=${formattedDate}`,
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
        const scheduledOvertime = data1.filter(
          (item) => item.es_type === "Scheduled"
        );
        setOvertimeOptions(
          scheduledOvertime.map((item) => ({
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
    fetchData();
  }, []);

  const handleConfirm = async () => {
    // --- VALIDATION --- //
    if (!overtimeSchedule || overtimeSchedule.trim() === "") {
      Alert.alert(
        "Missing Overtime Schedule",
        "Please select an overtime schedule before proceeding."
      );
      return;
    }

    if (!reason || reason.trim() === "") {
      Alert.alert(
        "Missing Reason",
        "Please provide a valid justification for the overtime."
      );
      return;
    }

    Alert.alert(
      "Confirm Add CD/RD OT",
      "Are you sure you want to confirm adding the employee overtime?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            setIsLoading(true);
            const EmployeeScheduleList = {
              LstId: lst_id,
              EsRemarks: "Reliever",
              ModifiedBy: getGName(),
              Day1Isot: lst[0].day == "Day1" ? true : null,
              Day2Isot: lst[0].day == "Day2" ? true : null,
              Day3Isot: lst[0].day == "Day3" ? true : null,
              Day4Isot: lst[0].day == "Day4" ? true : null,
              Day5Isot: lst[0].day == "Day5" ? true : null,
              Day6Isot: lst[0].day == "Day6" ? true : null,
              Day7Isot: lst[0].day == "Day7" ? true : null,
              Day1IsotEscode: lst[0].day == "Day1" ? overtimeSchedule : null,
              Day2IsotEscode: lst[0].day == "Day2" ? overtimeSchedule : null,
              Day3IsotEscode: lst[0].day == "Day3" ? overtimeSchedule : null,
              Day4IsotEscode: lst[0].day == "Day4" ? overtimeSchedule : null,
              Day5IsotEscode: lst[0].day == "Day5" ? overtimeSchedule : null,
              Day6IsotEscode: lst[0].day == "Day6" ? overtimeSchedule : null,
              Day7IsotEscode: lst[0].day == "Day7" ? overtimeSchedule : null,
              Day1OtType: lst[0].day == "Day1" ? "Reliever" : null,
              Day2OtType: lst[0].day == "Day2" ? "Reliever" : null,
              Day3OtType: lst[0].day == "Day3" ? "Reliever" : null,
              Day4OtType: lst[0].day == "Day4" ? "Reliever" : null,
              Day5OtType: lst[0].day == "Day5" ? "Reliever" : null,
              Day6OtType: lst[0].day == "Day6" ? "Reliever" : null,
              Day7OtType: lst[0].day == "Day7" ? "Reliever" : null,
              Day1OtReasonJustification: lst[0].day == "Day1" ? reason : null,
              Day2OtReasonJustification: lst[0].day == "Day2" ? reason : null,
              Day3OtReasonJustification: lst[0].day == "Day3" ? reason : null,
              Day4OtReasonJustification: lst[0].day == "Day4" ? reason : null,
              Day5OtReasonJustification: lst[0].day == "Day5" ? reason : null,
              Day6OtReasonJustification: lst[0].day == "Day6" ? reason : null,
              Day7OtReasonJustification: lst[0].day == "Day7" ? reason : null,
            };
            try {
              const response = await fetch(`${url}/employeeschedule/cdrdot`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(EmployeeScheduleList),
              });
              if (response.ok) {
                Alert.alert(
                  "Confirm Successful",
                  "Added CD/RD OT successfully.",
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

      <View>
        <Text style={styles.label}>Overtime Schedule:</Text>
        <Dropdown
          style={styles.dropdown}
          data={overtimeOptions}
          labelField="label"
          valueField="value"
          placeholder="Select an option"
          search
          searchPlaceholder="Type to search..."
          value={overtimeSchedule}
          onChange={(item) => setOvertimeSchedule(item.value)}
        />
      </View>

      <View>
        <Text style={styles.label}>Overtime Type:</Text>
        <TextInput
          style={styles.dataText}
          value={"Reliever"}
          editable={false}
        />
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
});

export default CDRDOTScreen;
