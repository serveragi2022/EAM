import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { url, headers } from "../api/httpclient";
import { getGBranch, getGName } from "../GlobalVariable";
import Spinner from "react-native-loading-spinner-overlay";
import { Dropdown } from "react-native-element-dropdown";
import Checkbox from "expo-checkbox";

const NIABSENTScreen = ({ route }) => {
  const { emp_id } = route.params;

  const navigation = useNavigation();
  const [lst, setLst] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedcategory, setselectedcategory] = useState("");
  const [categories, setCategories] = useState([
        { label: "AWOL", value: "AWOL" },
      { label: "OthersA", value: "OthersA" },
    { label: "OthersP", value: "OthersP" },
        { label: "SL", value: "SL" },
  ]);

    const [selectedLD, setSelected] = useState("");
    const optionsLD = ["Whole Day", "Half Day"];

  const [selectedDates, setSelectedDates] = useState([]);
  const [reason, setReason] = useState("");

  const formatDate = (rawDate) => {
    const date = new Date(rawDate);
    return (
      `${(date.getMonth() + 1).toString().padStart(2, "0")}/` +
      `${date.getDate().toString().padStart(2, "0")}/` +
      `${date.getFullYear()}`
    );
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${url}/employeeschedule/absent/noinfo/confirm?emp_id=${emp_id}&branch=${getGBranch()}`,
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
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleConfirm = async () => {
    // ✅ Validate

  if (selectedDates.length === 0) {
      Alert.alert("Date is Required", "Please select date.");
      return;
    }

    if (selectedcategory.trim() === "") {
      Alert.alert("Category Required", "Please provide category.");
      return;
    }

     if (selectedLD.trim() === "" && selectedcategory === "SL") {
          Alert.alert("Leave Duration Required", "Please select leave duration.");
          return;
        }


    if (reason.trim() === "") {
      Alert.alert("Reason Required", "Please provide reason.");
      return;
    }

    Alert.alert(
      "Confirm Add Absent",
      "Are you sure you want to confirm adding the employee absent?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            setIsLoading(true);

            try {
              for (let selected of selectedDates) {
                const item = lst.find((entry) => entry.a_id === selected.a_id);
                if (!item) continue;

                const EmployeeAbsent = {
                  EsId: item.es_id,
                  EmpId: item.emp_id,
                  DayDate: selected.date, // 🔧 fixed: was 'date'
                  DayEschedule: item.schedule,
                  DayEscode: item.schedule_code,
                  ACategory: selectedcategory,
                  AReason: reason,
                  CreatedBy: getGName(),
                  WithVlSl: true,
                  AId: item.a_id,
                LeaveDuration: selectedcategory == 'SL' ? selectedLD : null
                };

                await fetch(`${url}/employeeschedule/absent`, {
                  method: "PUT",
                  headers,
                  body: JSON.stringify(EmployeeAbsent),
                });
              }

              // ✅ Show success message after loop completes
              Alert.alert(
                "Success",
                `Successfully set ${selectedcategory} for selected dates.`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
              );
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Info Rows */}
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.dataText}>{lst[0]?.employee_name || "N/A"}</Text>
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.dataText}>{lst[0]?.department || "N/A"}</Text>
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

      <View style={{ marginTop: 10 }}>
        <Text style={styles.label}>Select Dates to Process:</Text>
        {lst.map((item, index) => {
          const isChecked = selectedDates.some((d) => d.a_id === item.a_id);

          return (
            <View key={index} style={styles.checkboxItem}>
              <Checkbox
                value={isChecked}
                onValueChange={(newValue) => {
                  if (newValue) {
                    setSelectedDates([
                      ...selectedDates,
                      { a_id: item.a_id, date: item.day_date },
                    ]);
                  } else {
                    setSelectedDates(
                      selectedDates.filter((d) => d.a_id !== item.a_id)
                    );
                  }
                }}
                color={isChecked ? "#007bff" : undefined}
              />
              <Text style={styles.checkboxLabel}>
                {formatDate(item.day_date)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Category */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.label}>Category</Text>
        <Dropdown
          style={styles.dropdown}
          data={categories}
          labelField="label"
          valueField="value"
          placeholder="Select Category"
          value={selectedcategory}
          onChange={(item) => setselectedcategory(item.value)}
        />
      </View>


         {selectedcategory === "SL" && (
      
           <View style={{ flex: 1, justifyContent: "left", alignItems: "left" , marginTop: 20}}>
             <Text style={styles.label}>Leave Duration</Text>
        <View style={{ flexDirection: "row" }}>
      
      
          {optionsLD.map((option) => (
            <TouchableOpacity
              key={option}
              style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}
              onPress={() => setSelected(option)}
              activeOpacity={0.8}
            >
              <Checkbox
                value={selectedLD === option}
                onValueChange={() => setSelected(option)}
                color={selectedLD === option ? "#007AFF" : undefined}
              />
              <Text style={{ marginLeft: 8, fontSize: 18 }}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>)}

      {/* Reason Input */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.label}>Reason:</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={reason}
          onChangeText={setReason}
          multiline
          placeholder="Enter reason"
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
  formHeader: { marginBottom: 20, alignItems: "center" },
  formNumber: { fontSize: 22, fontWeight: "600", color: "#333" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  labelContainer: { flex: 1 },
  label: { fontSize: 16, fontWeight: "bold", color: "#555" },
  dataText: { fontSize: 18, color: "#333", marginTop: 5 },
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
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginVertical: 5,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default NIABSENTScreen;
