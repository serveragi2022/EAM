import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./screens/HomeScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import LoginScreen from "./screens/LoginScreen";
import ScanScreen from "./screens/ScanScreen";
import HoldEmployeeScreen from "./screens/HoldEmployeeScreen";
import BacktoWorkScreen from "./screens/BacktoWorkScreen";
import FittoWorkScreen from "./screens/FittoWorkScreen";
import HoldBTWFTWScreen from "./screens/HoldBTWFTWScreen";
import HoldBTWFTWCreateScreen from "./screens/HoldBTWFTWCreateScreen";
import EmployeeAttendanceScreen from "./screens/EmployeeAttendanceScreen";
import EmployeeAttendanceReport from "./screens/EmployeeAttendanceReport";
import AddCDRDOTScreen from "./screens/AddCDRDOTScreen";
import CDRDOTScreen from "./screens/CDRDOTScreen";
import CreateBacktoWorkScreen from "./screens/CreateBacktoWorkScreen";
import CreateFittoWorkScreen from "./screens/CreateFittoWorkScreen";
import InternetBlocker from "./screens/InternetBlocker";
import HoldNoInfoScreen from "./screens/HoldNoInfoScreen";
import AddEARLYINScreen from "./screens/AddEARLYINScreen";
import EARLYINScreen from "./screens/EARLYINScreen";
import AddAbsentScreen from "./screens/AddAbsentScreen";
import ABSENTScreen from "./screens/ABSENTScreen";
import NIABSENTScreen from "./screens/NIABSENTScreen";
import EmployeeScheduleScreen from "./screens/EmployeeScheduleScreen";
import ReviseScheduleScreen from "./screens/ReviseScheduleScreen";
import AbsentAutoScreen from "./screens/AbsentAutoScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <InternetBlocker>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "Login" }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Home" }}
          />
          <Stack.Screen
            name="Registration"
            component={RegistrationScreen}
            options={{ title: "Employee Registration" }}
          />

<Stack.Screen
            name="EmployeeSchedule"
            component={EmployeeScheduleScreen}
            options={{ title: "Employee Schedule" }}
          />

          <Stack.Screen
            name="ReviseSchedule"
            component={ReviseScheduleScreen}
            options={{ title: "Revise Schedule" }}
          />
          <Stack.Screen
            name="EAM"
            component={EmployeeAttendanceScreen}
            options={{ title: "Employee Attendance Report" }}
          />

          <Stack.Screen
            name="EAMReport"
            component={EmployeeAttendanceReport}
            options={{ title: "" }}
          />

          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ title: "Scan Employee QR Code" }}
          />

          <Stack.Screen
            name="ADDCDRDOT"
            component={AddCDRDOTScreen}
            options={{ title: "Add CD/RD OT" }}
          />

          <Stack.Screen
            name="CDRDOT"
            component={CDRDOTScreen}
            options={{ title: "Add CD/RD OT" }}
          />

          <Stack.Screen name="HoldNoInfo" component={HoldNoInfoScreen} />

          <Stack.Screen name="HoldBTWFTW" component={HoldBTWFTWScreen} />
          <Stack.Screen
            name="HoldBTWFTWCreate"
            component={HoldBTWFTWCreateScreen}
          />
          <Stack.Screen
            name="BacktoWork"
            component={BacktoWorkScreen}
            options={{ title: "Back to Work" }}
          />

          <Stack.Screen
            name="CreateBacktoWork"
            component={CreateBacktoWorkScreen}
            options={{ title: "Create Back to Work" }}
          />

          <Stack.Screen
            name="CreateFittoWork"
            component={CreateFittoWorkScreen}
            options={{ title: "Create Fit to Work" }}
          />

          <Stack.Screen
            name="FittoWork"
            component={FittoWorkScreen}
            options={{ title: "Fit to Work" }}
          />

          <Stack.Screen
            name="ADDEARLYIN"
            component={AddEARLYINScreen}
            options={{ title: "Add EARLY-IN" }}
          />

          <Stack.Screen
            name="EARLYIN"
            component={EARLYINScreen}
            options={{ title: "Add EARLY-IN" }}
          />

          <Stack.Screen
            name="AddAbsent"
            component={AddAbsentScreen}
            options={{ title: "Add Absent" }}
          />

          <Stack.Screen
            name="ABSENT"
            component={ABSENTScreen}
            options={{ title: "Add Absent" }}
          />

          <Stack.Screen
            name="NIABSENT"
            component={NIABSENTScreen}
            options={{ title: "Set AWOL, Others, or SL to 'No Info'" }}
          />

           <Stack.Screen
            name="AbsentAuto"
            component={AbsentAutoScreen}
            options={{ title: "Absent (Auto Generated)" }}
          />
        </Stack.Navigator>
      </InternetBlocker>
    </NavigationContainer>
  );
}
