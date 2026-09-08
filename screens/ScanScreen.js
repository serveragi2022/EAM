import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { url, headers, headers2 } from "../api/httpclient";
import Spinner from "react-native-loading-spinner-overlay";
import { getGName } from "../GlobalVariable";
import * as ImagePicker from "expo-image-picker";
import * as Speech from "expo-speech";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [previousScans, setPreviousScans] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const errorStatuses = [
    "HOLD (FW and BW)",
    "HOLD (FW)",
    "HOLD (BW)",
    "HOLD (NO INFO)",
    "IN-ACTIVE",
    "UNSCHEDULED",
    "NO SCHEDULE",
    "HOLD (ABSENT)",
  ];

  const { width } = Dimensions.get("window");
  const [facing, setFacing] = useState("back");

  const toggleCamera = () => {
    setFacing((prev) => (prev === "front" ? "back" : "front"));
  };

  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => {
    (async () => {
      if (!permission) {
        const newPermission = await requestPermission();
        setHasPermission(newPermission.granted);
      } else {
        setHasPermission(permission.granted);
      }
    })();
  }, [permission]);

  // Countdown timer
  useEffect(() => {
    if (scanned) {
      const isErrorStatus =
        employeeData && errorStatuses.includes(employeeData.status);
      const initialCountdown = isErrorStatus || employeeData?.remarks !== "" ? 10 : 5;

      setCountdown(initialCountdown);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            setScanned(false);
            return initialCountdown;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [scanned, employeeData]);

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

  const handleUpdateImage = async (selectedEmployee) => {
    Alert.alert(
      "Update Image",
      "Choose an option",
      [
        { text: "Take Photo", onPress: () => openCamera(selectedEmployee) },
        { text: "Choose from Gallery", onPress: () => openGallery(selectedEmployee) },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async (selectedEmployee) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      confirmImageUpdate(selectedEmployee, result.assets[0].uri, result.assets[0].base64);
    }
  };

  const openGallery = async (selectedEmployee) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      confirmImageUpdate(selectedEmployee, result.assets[0].uri);
    }
  };

  const confirmImageUpdate = (selectedEmployee, Imguri) => {
    Alert.alert(
      "Confirm Update",
      "Are you sure you want to update this image?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => uploadImage(selectedEmployee, Imguri) },
      ]
    );
  };

  const uploadImage = async (selectedEmployee, Imguri) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("ModifiedBy", getGName());
      formData.append("EmpId", selectedEmployee.id);
      formData.append("photoFile", { uri: Imguri, type: "image/jpeg", name: "Photo" });

      const response = await fetch(`${url}/empdata`, {
        method: "PUT",
        headers: headers2,
        body: formData,
      });

      if (!response.ok) throw new Error(`Failed to update image. ${response.status}`);

      Alert.alert("Success", "Employee Image updated successfully!");

      const newUrl = await fetchSignedImage(selectedEmployee.id);

      setEmployeeData((prev) => ({ ...prev, imageUrl: newUrl }));

      setPreviousScans((prev) =>
        prev.map((scan) =>
          scan.id === selectedEmployee.id ? { ...scan, imageUrl: newUrl } : scan
        )
      );
    } catch (error) {
      console.error("Upload Error:", error.message);
      Alert.alert("Error", `Could not update image. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
  if (!data) return;

  setScanned(true);
  setIsLoading(true);

  try {
    const response = await fetch(
      `${url}/empdata/qrcode?qrcode_text=${encodeURIComponent(data)}&tby=${getGName()}`,
      { method: "GET", headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    if (!json) throw new Error("Invalid response format");

    const employee = {
      id: json.id,
      name: json.name,
      dept_code: json.dept_code,
      schedule: json.schedule,
      status: json.status,
      employer: json.employer,
    };

    if (employee.status === "In-Active") {
      Alert.alert("Employee Status is In-Active.", "Coordinate to HRD.");
      setIsLoading(false);
      return;
    }

    const text =
      employee.status === "NO SCHEDULE"
        ? "No Schedule"
        : employee.status === "UNSCHEDULED"
        ? "Un-Scheduled"
        : employee.status === "HOLD (FW and BW)"
        ? "Hold for Fit to Work and Back to Work"
        : employee.status === "HOLD (FW)"
        ? "Hold for Fit to Work"
        : employee.status === "HOLD (BW)"
        ? "Hold for Back to Work"
        : employee.status === "HOLD (NO INFO)"
        ? "Hold No Info"
        : employee.status === "HOLD (ABSENT)"
        ? "Hold for Absent"
        : employee.status;

    Speech.speak(text, { language: "en-US", pitch: 1.0, rate: 1.0 });

    // Fetch image URL and merge it into employee object
    const imageUrl = await fetchSignedImage(employee.id);
    setEmployeeData({ ...employee, imageUrl });

    // Update previous scans
    setPreviousScans((prev) => [{ ...employee, imageUrl }, ...prev]);
  } catch (error) {
    console.error("Error fetching employee data:", error.message);
    Alert.alert("Error", "Failed to fetch employee details. Coordinate to HRD.");
  } finally {
    setIsLoading(false);
  }
};


  const loadImageForScan = async (index) => {
    const scan = previousScans[index];
    if (!scan.imageUrl) {
      setIsLoading(true);
      const imageUrl = await fetchSignedImage(scan.id);
      setPreviousScans((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], imageUrl };
        return updated;
      });
      setIsLoading(false);
    }
  };

  if (hasPermission === null) return <Text>Requesting camera permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Camera Toggle */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 40,
          right: 20,
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 10,
          borderRadius: 8,
          zIndex: 999,
        }}
        onPress={() => setFacing(facing === "front" ? "back" : "front")}
      >
        <Ionicons name="camera-reverse" size={24} color="white" />
      </TouchableOpacity>

      {/* Camera View */}
      {!scanned && (
        <View style={{ flex: 1 }}>
          <CameraView
            facing={facing}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            zoom={0.5}
            focusMode="on"
            torch={false}
            autoFocus="on"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlay}>
            <View style={styles.scanBox} />
          </View>
        </View>
      )}

      {scanned && (
        <Text style={styles.countdownText}>Scanning re-enables in {countdown}s</Text>
      )}

      {scanned && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setScanned(false);
            setEmployeeData(null);
          }}
        >
          <Ionicons name="refresh-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}

      {/* Current Employee Data */}
      {employeeData && scanned && (
        <View style={styles.employeeData}>
          <Text style={styles.labelTextStatus}>Status:</Text>
          <TextInput
            style={[
              styles.readOnlyInputStatus,
              {
                backgroundColor: errorStatuses.includes(employeeData.status)
                  ? "#f8d7da"
                  : "#d4edda",
                color: errorStatuses.includes(employeeData.status)
                  ? "#721c24"
                  : "#155724",
                fontSize: width < 400 ? 30 : 40,
              },
            ]}
            value={employeeData.status}
            editable={false}
          />

          {employeeData.imageUrl ? (
            <Image
              source={{ uri: employeeData.imageUrl }}
              style={styles.largeImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.noImageText}>No Image Available</Text>
          )}

          <View style={styles.rowContainer}>
            <View style={styles.column}>
              <Text style={styles.labelText}>Name:</Text>
              <TextInput style={styles.readOnlyInput} value={employeeData.name} readOnly={false} />
            </View>

            <View style={styles.column}>
              <Text style={styles.labelText}>Department:</Text>
              <TextInput style={styles.readOnlyInput} value={employeeData.dept_code} readOnly={false} />
            </View>
          </View>

          <Text style={styles.labelText}>Schedule:</Text>
          <TextInput style={styles.readOnlyInput} value={employeeData.schedule} readOnly={false} />
        </View>
      )}

      {/* View Previous Scans */}
      {employeeData && (
        <TouchableOpacity
          style={styles.viewScansButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="list-outline" size={24} color="white" />
          <Text style={styles.buttonText}>View Previous Scans</Text>
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Previous Scans</Text>
            <ScrollView style={styles.scanList}>
              {previousScans.map((scan, index) => (
                <View
                  key={index}
                  style={styles.scanItem}
                  onTouchStart={() => loadImageForScan(index)} // lazy load
                >
                  {scan.imageUrl ? (
                    <Image source={{ uri: scan.imageUrl }} style={styles.scanImage} />
                  ) : (
                    <Text style={styles.noImageText}>No Image</Text>
                  )}

                  <Text
                    fontSize="16"
                    backgroundColor={errorStatuses.includes(scan.status) ? "#f8d7da" : "#d4edda"}
                    color={errorStatuses.includes(scan.status) ? "#721c24" : "#155724"}
                  >
                    {scan.name} ({scan.dept_code}) - {scan.employer} - {scan.status}
                  </Text>

                  <TouchableOpacity style={styles.updateButton} onPress={() => handleUpdateImage(scan)}>
                    <Ionicons name="image-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Update Image</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Spinner visible={isLoading} textContent={"Loading..."} textStyle={{ color: "#FFF" }} />
    </ScrollView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#fff" },
  countdownText: { fontSize: 16, color: "#444", textAlign: "center", marginVertical: 8 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#007BFF", paddingVertical: 12, borderRadius: 8, marginTop: 12 },
  buttonText: { color: "#fff", fontSize: 15, marginLeft: 8 },
  employeeData: { marginTop: 16, padding: 16, borderRadius: 8, backgroundColor: "#f9f9f9", elevation: 2 },
  labelText: { fontSize: 15, fontWeight: "bold", marginTop: 12 },
  labelTextStatus: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  readOnlyInput: { fontSize: 14, backgroundColor: "#ffffff", padding: 10, borderRadius: 6, marginTop: 4 },
  readOnlyInputStatus: { padding: 12, borderRadius: 8, textAlign: "center", fontWeight: "bold" },
  largeImage: { width: 160, height: 160, borderRadius: 12, alignSelf: "center", marginVertical: 16 },
  noImageText: { textAlign: "center", color: "#888", fontSize: 14, marginVertical: 16 },
  rowContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  column: { flex: 0.48 },
  viewScansButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#28a745", paddingVertical: 12, borderRadius: 8, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: "#fff", width: 320, height: 480, borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  scanList: { flex: 1 },
  scanItem: { marginBottom: 16, padding: 12, backgroundColor: "#f1f1f1", borderRadius: 8 },
  scanImage: { width: 120, height: 120, borderRadius: 8, alignSelf: "center", marginBottom: 8 },
  updateButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#007BFF", paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  closeButton: { backgroundColor: "#dc3545", paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  closeButtonText: { textAlign: "center", color: "#fff", fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "transparent" },
  scanBox: { width: 250, height: 250, borderWidth: 3, borderColor: "#00FF00", backgroundColor: "rgba(0, 0, 0, 0.2)" },
});
