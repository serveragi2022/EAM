import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import Spinner from "react-native-loading-spinner-overlay";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Searchbar } from "react-native-paper";
import {
  getGAccessDept,
  getGAccessSubDept,
  getGAccessSubBranch,
  getGBranch,
  getGName,
} from "../GlobalVariable";
import { url, headers, headers2 } from "../api/httpclient";

export default function RegistrationScreen() {
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [sub_department, setSubDept] = useState("");
  const [employer, setEmployer] = useState("");
  const [emp_id, setEmpId] = useState("");
  const [attachedImagePath, setAttachedImagePath] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageResult = async (result) => {
    if (!result.canceled && result.assets.length > 0) {
      const capturedImage = result.assets[0].uri;

      // Set the new image
      setAttachedImagePath(capturedImage);
    }
  };

  const openImagePicker = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (
      cameraPermission.status !== "granted" ||
      mediaLibraryPermission.status !== "granted"
    ) {
      console.error("Camera or media library permission not granted");
      return;
    }
    Alert.alert(
      "Choose an option",
      "",
      [
        {
          text: "Camera",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 1,
            });
            handleImageResult(result);
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 1,
            });
            handleImageResult(result);
          },
        },
      ],
      { cancelable: true },
    );
  };

  const deptList = getGAccessDept()
    .split(",")
    .map((dept) => dept.trim());

  useEffect(() => {
    if (!department && deptList.length === 1) {
      setDepartment(deptList[0]);
    }
  }, [deptList, department]);

  useEffect(() => {
    setFilteredEmployees(
      employees.filter((employee) =>
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [searchQuery, employees]);

  const fetchEmployees = async (selectedDepartment) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${url}/empdata/employeelist?branch=${getGBranch()}&department=${encodeURIComponent(selectedDepartment)}&access_sub_branch=${encodeURIComponent(getGAccessSubBranch())}&access_sub_department=${encodeURIComponent(getGAccessSubDept())}`,
        {
          method: "GET",
          headers: headers,
        },
      );

      if (response.ok) {
        const json = await response.json();
        const employeesData = json.map((item) => ({
          id: item.emp_id,
          name: item.name,
          first_name: item.first_name,
          last_name: item.last_name,
          employer: item.company_code,
          sub_department: item.sub_department,
        }));
        employeesData.sort((a, b) => a.name.localeCompare(b.name));
        setEmployees(employeesData);
      } else {
        console.error("Failed to fetch employees", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEmployee = async () => {
    if (isSubmitting) {
      console.log("Submission already in progress");
      return;
    }

    // Validation for required fields
    if (!department) {
      Alert.alert("Validation Error", "Please select a department.");
      return;
    }

    if (!name) {
      Alert.alert("Validation Error", "Please select an employee name.");
      return;
    }

    if (!attachedImagePath) {
      Alert.alert("Validation Error", "Please attach an employee photo.");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Do you want to proceed registration?",
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => {
            setIsSubmitting(false);
          },
        },
        {
          text: "Yes",
          onPress: async () => {
            // Mark submission in progress BEFORE the request starts,
            // otherwise the isSubmitting guard above never actually blocks anything.
            setIsSubmitting(true);
            setIsLoading(true);

            const qrValue = `$AGI-${emp_id}`;
            setQrValue(qrValue);

            try {
              // Using expo-file-system's uploadAsync instead of fetch + FormData.
              // Recent Expo SDKs (57+) no longer reliably support React Native's
              // legacy { uri, type, name } FormData file shorthand, which throws
              // "Unsupported FormData part implementation". uploadAsync builds the
              // multipart body (and its boundary) natively, sidestepping that issue.
              const uploadResult = await FileSystem.uploadAsync(
                `${url}/empdata`,
                attachedImagePath,
                {
                  httpMethod: "POST",
                  uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                  fieldName: "photoFile",
                  mimeType: "image/jpeg",
                  parameters: {
                    CreatedBy: String(getGName()),
                    EmpId: String(emp_id),
                  },
                  headers: {
                    // Reuse the same basic-auth credential already set up in httpclient.js
                    Authorization: headers2.get("Authorization"),
                    Accept: "application/json",
                    // Do NOT set Content-Type here — uploadAsync generates the
                    // correct multipart boundary itself; a hardcoded Content-Type
                    // without a matching boundary breaks the upload server-side.
                  },
                },
              );

              if (uploadResult.status >= 200 && uploadResult.status < 300) {
                Alert.alert("", "Employee registered successfully.", [
                  {
                    text: "OK",
                  },
                ]);

                clearImage();
                setFirstName("");
                setLastName("");
                setEmployer("");
                setEmpId("");
                setName("");
                setSubDept("");
                setAttachedImagePath(null);
                fetchEmployees(department);
              } else {
                console.error("Request failed with status:", uploadResult.status);
                console.error("Error content:", uploadResult.body);
                Alert.alert(
                  "Error",
                  uploadResult.body || "Failed to register employee. Please try again.",
                );
              }
            } catch (error) {
              console.error("Network error:", error.message);

              Alert.alert(
                "Network Error",
                "An error occurred while processing your request.",
              );
            } finally {
              setIsLoading(false);
              setIsSubmitting(false);
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  const clearImage = () => {
    setAttachedImagePath(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Employee Registration Form</Text>

      <View style={styles.card}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={department}
            onValueChange={(itemValue) => {
              setDepartment(itemValue);
              if (itemValue) {
                fetchEmployees(itemValue); // skip fetch when placeholder is reselected
              }
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select Department" value="" />
            {deptList.map((dept, index) => (
              <Picker.Item key={index} label={dept} value={dept} />
            ))}
          </Picker>
        </View>

        <View style={styles.inputContainer}>
          <Searchbar
            placeholder="Search Employee"
            onChangeText={(query) => setSearchQuery(query)}
            value={searchQuery}
            style={styles.searchbar}
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={name}
              onValueChange={(itemValue) => {
                setName(itemValue);
                const selectedEmployee = employees.find(
                  (emp) => emp.name === itemValue,
                );
                if (selectedEmployee) {
                  setFirstName(selectedEmployee.first_name);
                  setLastName(selectedEmployee.last_name);
                  setEmployer(selectedEmployee.employer);
                  setEmpId(selectedEmployee.id);
                  setSubDept(selectedEmployee.sub_department);
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Employee" value="" />
              {filteredEmployees.map((employee) => (
                <Picker.Item
                  key={employee.id}
                  label={employee.name}
                  value={employee.name}
                />
              ))}
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={styles.imagePicker}
          onPress={attachedImagePath ? clearImage : openImagePicker}
        >
          <Ionicons name="image-outline" size={24} color="#0078D4" />
          <Text style={styles.imagePickerText}>
            {attachedImagePath
              ? "Clear Employee Photo"
              : "Attach Employee Photo"}
          </Text>
        </TouchableOpacity>
        <View alignItems="center">
          {attachedImagePath && (
            <Image source={{ uri: attachedImagePath }} style={styles.image} />
          )}
        </View>

        <Spinner
          visible={isLoading}
          textContent={"Loading..."}
          textStyle={{ color: "#FFF" }}
        />

        <TouchableOpacity style={styles.button} onPress={saveEmployee}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f0f0f0", // Light gray background
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff", // Flat white background for card
    borderRadius: 8, // Slightly smaller border radius for a cleaner look
    padding: 20, // Added padding for inner content
    elevation: 0, // Removed shadow for flat design
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 20,
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#333333",
  },
  searchbar: {
    marginBottom: 10,
  },
  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff", // Flat white background
    borderRadius: 8,
    padding: 15,
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 20,
  },
  imagePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333333",
  },
  button: {
    backgroundColor: "#0078D4", // Primary button color
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
});