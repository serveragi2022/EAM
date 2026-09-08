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
import { getGName } from "../GlobalVariable";
import Spinner from "react-native-loading-spinner-overlay";
import { Dropdown } from "react-native-element-dropdown";
import Checkbox from "expo-checkbox";

const ABSENTScreen = ({ route }) => {
  const { date, department_code, lst_id } = route.params;

  const navigation = useNavigation();
  const [lst, setLst] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedcategory, setselectedcategory] = useState("");
  const [categories, setCategories] = useState([
    { label: "AWOL", value: "AWOL" },
    { label: "No Info", value: "No Info" },
    { label: "OthersP", value: "OthersP" },
    { label: "OthersA", value: "OthersA" },
    { label: "SL", value: "SL" },
  ]);

  const [selectedLD, setSelected] = useState("");
  const optionsLD = ["Whole Day", "Half Day"];

  const [reason, setReason] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${url}/employeeschedule/absent/confirm?lst_id=${lst_id}&date=${date}`,
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

    const response = await fetch(
      `${url}/employeeschedule/validateabsent?date=${date}&emp_id=${lst[0].emp_id}`,
      {
        method: "GET",
        headers: headers,
      }
    );

    if (response.ok) {
      const category = await response.text();
      if (category === "No Info") {
        Alert.alert(
          "No Info already added for the selected employee.",
          "Please add absent in the NO INFO module."
        );
        return;
      } else {
        Alert.alert("Absent already added for the selected employee.", "");
        return;
      }
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
            const EmployeeAbsent = {
              EsId: lst[0].es_id,
              EmpId: lst[0].emp_id,
              DayDate: date,
              DayEschedule: lst[0].schedule,
              DayEscode: lst[0].schedule_code,
              ACategory: selectedcategory,
              AReason: reason,
              CreatedBy: getGName(),
              LeaveDuration: selectedcategory == "SL" ? selectedLD : null,
            };

            try {
              const response = await fetch(`${url}/employeeschedule/absent`, {
                method: "PUT",
                headers: headers,
                body: JSON.stringify(EmployeeAbsent),
              });
              if (response.ok) {
                Alert.alert("Success", "Added Absent successfully.");
                navigation.goBack();
              } else {
                Alert.alert("Error", "Failed to add absent.");
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formHeader}>
        <Text style={styles.formNumber}>{lst[0]?.es_ref || "N/A"}</Text>
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
        <View
          style={{
            justifyContent: "left",
            alignItems: "left",
            marginTop: 20,
          }}
        >
          <Text style={styles.label}>Leave Duration</Text>
          <View style={{ flexDirection: "row" }}>
            {optionsLD.map((option) => (
              <TouchableOpacity
                key={option}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 20,
                }}
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
        </View>
      )}

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
});

export default ABSENTScreen;
