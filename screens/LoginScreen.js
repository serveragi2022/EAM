import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  BackHandler,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  setGBranch,
  setGName,
  setGDeviceName,
  setGIpAddress,
  setGDepartment,
  setGUserName,
  setGUserId,
  setGPassword,
  setGAccessBranch,
  getGVersion,
  setGAccessModule,
  setGAccessDept,
  setGAccessSubDept,
  setGAccessSubBranch,
  setGAccessSubDeptEs,
  setGAccessDeptEs,
  setEmpId
} from "../GlobalVariable";
import { url, headers } from "../api/httpclient";
import * as Device from "expo-device";
import * as Network from "expo-network";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const navigation = useNavigation();
  const apkUrl = "https://storage.googleapis.com/agi-hrms-bucket/eam.apk";

  useEffect(() => {
    const fetchIpAddress = async () => {
      const ip = await Network.getIpAddressAsync();
      setIpAddress(ip);
    };
    fetchIpAddress();
    checkBiometricSupport();
    attemptBiometricLogin();
  }, []);

  useEffect(() => {
    const backAction = () => loggedIn;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [loggedIn]);

  // Check if biometric authentication is available
  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricAvailable(compatible && enrolled);
  };

  // Attempt biometric login
  const attemptBiometricLogin = async () => {
    try {
      const savedUsername = await SecureStore.getItemAsync("username");
      const savedPassword = await SecureStore.getItemAsync("password");

      if (savedUsername && savedPassword) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate with Fingerprint",
          fallbackLabel: "Enter Password",
        });

        if (result.success) {
          setUsername(savedUsername);
          setPassword(savedPassword);
          handleLogin(savedUsername, savedPassword);
        }
      }
    } catch (error) {
      console.error("Biometric login failed:", error);
    }
  };

  // Handle login process
  const handleLogin = async (user = username, pass = password) => {
    try {
   /*    { let is_updated = "";
     const apiUrl2 = `${url}/login/validateversion/mobile?version=${getGVersion()}`;

      try {
        const response = await fetch(apiUrl2, { method: "GET", headers });
        is_updated = response.ok ? "Yes" : "No";
      } catch (error) {}

      if (is_updated === "No") {
        Alert.alert("New Update Available", "Please update the app to the latest version.", [
          { text: "Cancel", style: "cancel" },
          { text: "Update", onPress: () => Linking.openURL(apkUrl) },
        ]);
        return;
      }
    } 
 */
      setIsLoading(true);
      const apiUrl = `${url}/login/mobile`;
      const MainUseraccounts = { Username: user, Pass: pass };

      fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(MainUseraccounts),
      })
        .then((response) => (response.status === 200 ? response.json() : null))
        .then(async (data) => {
          if (data) {
            const name = data.name;
            const userid = data.user_id;
            const branch = data.branch;
            const access_module = data.access_module;
            const access_dept = data.access_department_hrms;
            const access_sub_dept = data.access_sub_department;

           const access_dept_es = data.access_department_es;
            const access_sub_dept_es = data.access_sub_department_es;

            const access_sub_branch = data.access_sub_branch;
            const department = data.department;

            const empId = data.emp_id;
            setEmpId(empId);

            setGAccessModule(access_module);
            setGAccessDept(access_dept);
            setGAccessSubDept(access_sub_dept);

            setGAccessDeptEs(access_dept_es);
            setGAccessSubDeptEs(access_sub_dept_es);

            setGAccessSubBranch(access_sub_branch);
            setLoggedIn(true);
            setGName(name);
            setGUserName(user);
            setGPassword(pass);
            setGUserId(userid);
            setGBranch("AGI-Calamba");
            setGDepartment(department);
            setGIpAddress(ipAddress);
            setGDeviceName(Device.deviceName);
            setGAccessBranch("AGI-Calamba");

            console.log("Login successful for user:", empId);

            // 🔹 Password Change Detection
            const savedPassword = await SecureStore.getItemAsync("password");
            if (savedPassword && savedPassword !== pass) {
              await SecureStore.deleteItemAsync("username");
              await SecureStore.deleteItemAsync("password");
              Alert.alert("Security Notice", "Password changed. Please log in manually.");
            } else {
              await SecureStore.setItemAsync("username", user);
              await SecureStore.setItemAsync("password", pass);
            }

            Alert.alert("", "Login Successfully.", [{ text: "OK", onPress: () => navigation.replace("Home") }]);

            const accessHistoryData = {
              Action: "Login",
              Name: name,
              Pc: Device.deviceName,
              IpAddress: ipAddress,
              Version: getGVersion(),
              Department: department,
              Branch: "AGI-Calamba",
              App: "EAM",
            };
            fetch(`${url}/accesshistory`, { method: "POST", headers, body: JSON.stringify(accessHistoryData) });
          } else {
            Alert.alert(data, "Username / Password Incorrect.", [{ text: "OK" }]);
          }
        })
        .catch((ex) => {
          console.error("Login error:", ex);
          Alert.alert("Error", "Failed to connect to the server. Please check your internet connection.", [{ text: "OK" }]);
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      Alert.alert("Error", "An error occurred during login.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../assets/icon.png")} style={styles.logo} />
        <Text style={styles.title}>Employee Attendance Monitoring</Text>
      </View>

      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} placeholderTextColor="#888" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} placeholderTextColor="#888" />

      {isLoading ? (
        <ActivityIndicator size="large" color="#0078D4" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => handleLogin()}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}

      {isBiometricAvailable && (
        <TouchableOpacity style={styles.biometricButton} onPress={attemptBiometricLogin}>
          <Text style={styles.buttonText}>Login with Fingerprint</Text>
        </TouchableOpacity>
      )}

      <Text>{'Version ' + getGVersion()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16, backgroundColor: "#f0f0f0" },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { width: 120, height: 120, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "600", color: "#333" },
  input: { height: 48, borderColor: "#ccc", borderWidth: 1, borderRadius: 8, marginBottom: 15, paddingHorizontal: 12, backgroundColor: "#fff", fontSize: 16, color: "#333" },
  button: { backgroundColor: "#0078D4", paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  biometricButton: { backgroundColor: "#28a745", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 10 },
});

export default LoginScreen;
