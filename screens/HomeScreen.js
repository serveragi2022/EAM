import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getGBranch,
  getGName,
  getGDepartment,
  getGVersion,
  getGAccessModule,
  getGDeviceName,
  getGIpAddress,
  getEmpId
} from "../GlobalVariable";
import { url, headers } from "../api/httpclient";

const DashboardTile = ({ icon, label, onPress, color }) => (
  <TouchableOpacity style={styles.tile} onPress={onPress}>
    <Ionicons name={icon} size={36} color={color} />
    <Text style={styles.tileText}>{label}</Text>
  </TouchableOpacity>
);


// Helper: fetch signed image URL
const fetchSignedImage = async (empId) => {
  try {

    const res = await fetch(`${url}/empdata/${empId}/image`, { headers });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    return json.imageUrl || null; // fallback if missing
  } catch (e) {
    console.error("Failed to fetch signed URL", e);
    return null;
  }
};

export default function HomeScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCategory, setModalCategory] = useState(null);

  const accessModule = getGAccessModule();
  const canRegisterEmployee = accessModule?.includes("Employee Data Register");
  const canScanEmployee = accessModule?.includes("Employee Data Scan");
  const canCertifyFW = accessModule?.includes("Employee Fit to Work Certify");
  const canConfirmBW = false; //accessModule?.includes("Employee Back to Work Confirm");
  const canCreateBW = false; //accessModule?.includes("Employee Back to Work Request");
  const canViewAttendance = accessModule?.includes("Employee Attendance");
  const canAddCDRDOT = accessModule?.includes("Employee Schedule Add CD/RD OT");
  const canAddEarlyIn = accessModule?.includes(
    "Employee Schedule Add Early-In"
  );
  const canAddAbsent = accessModule?.includes("Employee Schedule Add Absent");
  // NEW: separate permission check for the auto-generated absent list
  const canAddAbsentAuto = accessModule?.includes("Employee Schedule Add Absent");
  const canNoInfo = accessModule?.includes("Employee Schedule No Info");
  const canReviseSchedule = accessModule?.includes("Employee Schedule Revise");
  const [empPhoto, setEmpPhoto] = useState(null);
  React.useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const imageUrl = await fetchSignedImage(getEmpId()); // replace with dynamic ID
        setEmpPhoto(imageUrl);
      } catch (e) {
        console.error("Failed to load profile image", e);
      }
    };

    fetchProfileImage();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          const accessHistoryData = {
            Action: "Logout",
            Name: getGName(),
            Pc: getGDeviceName(),
            IpAddress: getGIpAddress(),
            Version: getGVersion(),
            Department: getGDepartment(),
            Branch: getGBranch(),
            App: "EAM",
          };
          await fetch(`${url}/accesshistory`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(accessHistoryData),
          });
          navigation.replace("Login");
        },
      },
    ]);
  };

  const openModal = (category) => {
    setModalCategory(category);
    setModalVisible(true);
  };
  const handleSelectionBTW = (selection) => {
    setModalVisible(false);
    navigation.navigate(selection, { category: modalCategory });
  };
  const handleSelectionFTW = (selection) => {
    setModalVisible(false);
    navigation.navigate(selection, { category: "FW" });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.header}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Image
              source={{ uri: empPhoto }}
              style={styles.profileImageLarge}
              resizeMode="cover"
            />
            <Text style={styles.welcome}>Welcome, {getGName()}</Text>
            <Text style={styles.subText}>
              {getGDepartment()} • {getGBranch()}
            </Text>
          </View>

          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#FF6347" />
          </TouchableOpacity>
        </View>

        <View style={styles.dashboard}>
          {canRegisterEmployee && (
            <DashboardTile
              icon="person-add-outline"
              label="Register"
              onPress={() => navigation.navigate("Registration")}
              color="#0078D4"
            />
          )}
          {canScanEmployee && (
            <DashboardTile
              icon="qr-code-outline"
              label="Scan QR"
              onPress={() => navigation.navigate("Scan")}
              color="#34A853"
            />
          )}
          {canReviseSchedule && (
            <DashboardTile
              icon="create-outline"
              label="Schedule"
              onPress={() => navigation.navigate("EmployeeSchedule")}
              color="#28AFDF"
            />
          )}
          {canAddCDRDOT && (
            <DashboardTile
              icon="add-circle-outline"
              label="CD/RD OT"
              onPress={() => navigation.navigate("ADDCDRDOT")}
              color="#34A"
            />
          )}
          {canAddEarlyIn && (
            <DashboardTile
              icon="add-circle-outline"
              label="Early-In"
              onPress={() => navigation.navigate("ADDEARLYIN")}
              color="#22EFDF"
            />
          )}
          {canCertifyFW && (
            <DashboardTile
              icon="fitness-outline"
              label="Fit to Work"
              onPress={() => handleSelectionFTW("HoldBTWFTW")}
              color="#FF8C00"
            />
          )}
          {(canConfirmBW || canCreateBW) && (
            <DashboardTile
              icon="chevron-back-circle-outline"
              label="Back to Work"
              onPress={() => openModal("BW")}
              color="#FF6347"
            />
          )}
          {canNoInfo && (
            <DashboardTile
              icon="information-circle-outline"
              label="No Info"
              onPress={() => navigation.navigate("HoldNoInfo")}
              color="#FF8Ca0"
            />
          )}
          {(canViewAttendance || canAddAbsent || canAddAbsentAuto) && (
            <DashboardTile
              icon="document-text-outline"
              label="Attendance"
              onPress={() => openModal("Attendance")}
              color="#8A2B"
            />
          )}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Action</Text>
              {modalCategory === "Attendance" ? (
                <>
                  {canAddAbsent && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleSelectionFTW("AddAbsent")}
                    >
                      <Text style={styles.modalButtonText}>Add Absent</Text>
                    </TouchableOpacity>
                  )}
                  {/* NEW: navigates to the auto-generated absent screen */}
                  {canAddAbsentAuto && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleSelectionFTW("AbsentAuto")}
                    >
                      <Text style={styles.modalButtonText}>
                        Absent (Auto Generated)
                      </Text>
                    </TouchableOpacity>
                  )}
                  {canViewAttendance && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleSelectionFTW("EAM")}
                    >
                      <Text style={styles.modalButtonText}>
                        View Attendance Report
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  {canCreateBW && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleSelectionBTW("HoldBTWFTWCreate")}
                    >
                      <Text style={styles.modalButtonText}>
                        Create 'Back to Work Form'
                      </Text>
                    </TouchableOpacity>
                  )}
                  {canConfirmBW && (
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleSelectionBTW("HoldBTWFTW")}
                    >
                      <Text style={styles.modalButtonText}>
                        Confirm 'Back to Work Form'
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
  },
  subText: {
    fontSize: 16,
    color: "#666",
  },
  dashboard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    marginBottom: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  tileText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
    color: "#000",
  },
  modalButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#0078D4",
    borderRadius: 10,
    marginBottom: 15,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  modalCancel: {
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: "red",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ccc",
  },
  profileImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    backgroundColor: "#ccc",
  },
});