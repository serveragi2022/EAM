import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  Switch,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import {
  getGAccessDeptEs,
  getGDepartment,
  getGAccessSubBranch,
  getGAccessSubDeptEs,
} from "../GlobalVariable";
import { url, headers } from "../api/httpclient";

const EmployeeAttendanceScreen = () => {
  const navigation = useNavigation();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [sub_departments, setSubDepartments] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [entryScan, setEntryScan] = useState("All");

  const [selectedDepartments, setSelectedDepartments] = useState(null);
  const [selectedSubDepartments, setSelectedSubDepartments] = useState(null);
  const [selectedEmployers, setSelectedEmployers] = useState(null);
  const [selectedPositions, setSelectedPositions] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState("All");

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${url}/eschedule?department=All`, {
          method: "GET",
          headers,
        });

        if (!response.ok) throw new Error("Failed to fetch schedule data");

        const data = await response.json();
        setSchedules([
          { label: "All", value: "All" },
          ...data.map((item) => ({
            label: item.schedule,
            value: item.schedule,
          })),
        ]);
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const accessDept = getGAccessDeptEs();
    if (accessDept) {
      const deptList = accessDept.split(",").map((dept) => ({
        label: dept.trim(),
        value: dept.trim(),
      }));

      // Add "All" only if there are more than 14 departments
      setDepartments(
        deptList.length >= 14
          ? [{ label: "All", value: "All" }, ...deptList]
          : deptList
      );
    }
  }, []);

  useEffect(() => {
    if (getGAccessSubBranch()) {
      const employerList = getGAccessSubBranch()
        .split(",")
        .map((emp) => ({
          label: emp.trim(),
          value: emp.trim(),
        }));

      if (getGDepartment() == "Outsource Agency") {
        setEmployers([...employerList]);
      } else {
        setEmployers([{ label: "All", value: "All" }, ...employerList]);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPositions = async () => {
      if (!selectedDepartments) return;
      try {
        const response = await fetch(
          `${url}/position_title/filter5?department=${encodeURIComponent(
            selectedDepartments
          )}&branch=AGI-Calamba`,
          { headers }
        );
        const data = await response.json();
        setPositions([
          { label: "All", value: "All" },
          ...data.map((pos) => ({ label: pos.position, value: pos.position })),
        ]);
      } catch (error) {
        console.error("Error fetching positions:", error);
      }
    };
    fetchPositions();
  }, [selectedDepartments]);


   useEffect(() => {
    const fetchSubDepts = async () => {
      if (!selectedDepartments) return;
      try {
        const response = await fetch(
          `${url}/subdepartment/filter2?department=${encodeURIComponent(
            selectedDepartments
          )}`,
          { headers }
        );
        const data = await response.json();
        setSubDepartments([
          { label: "All", value: "All" },
          ...data.map((sub) => ({ label: sub.sub_department, value: sub.sub_department })),
        ]);
      } catch (error) {
        console.error("Error fetching sub departments:", error);
      }
    };
    fetchSubDepts();
  }, [selectedDepartments]);

  const handleViewReport = async () => {
    // Validation: Ensure Department, Employer, and Position are selected
    if (!selectedDepartments || !selectedEmployers || !selectedPositions) {
      alert(
        "Please select a Department, Employer, and Position before viewing the report."
      );
      return;
    }
    try {
      const apiUrl = `${url}/empdata/attendance/report?date=${formatDate(
        date
      )}&department=${encodeURIComponent(
        selectedDepartments
      )}&sub_department=${encodeURIComponent(selectedSubDepartments)}&employer=${selectedEmployers}&position=${selectedPositions}&entry_scan=${entryScan}&schedule=${selectedSchedule}&access_sub_dept=${getGAccessSubDeptEs()}`;

      // Wait for fetch to resolve
      const response = await fetch(apiUrl, { method: "GET", headers: headers });

      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Wait for JSON parsing
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const eam = data.map((item) => ({
          date: item.date,
          department_search: item.department_search,
          employer_search: item.employer_search,
          department: item.department,
          employer: item.employer,
          employee_name: item.employee_name,
          position: item.position,
          schedule: item.schedule,
          time_in: item.time_in,
          assigned_location: item.assigned_location,
          status: item.status,
          absent_remarks: item.absent_remarks || "", // Ensure absent_remarks is defined
        }));

        // Navigate only if data is available
        navigation.navigate("EAMReport", {
          date: formatDate(date),
          department: selectedDepartments,
          employer: selectedEmployers,
          attendanceData: eam,
        });
      } else {
        navigation.navigate("EAMReport", {
          date: formatDate(date),
          department: selectedDepartments,
          employer: selectedEmployers,
          attendanceData: [],
        });
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Date Picker */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.input}
        >
          <Text>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {[
          {
            label: "Department",
            data: departments,
            value: selectedDepartments,
            onChange: setSelectedDepartments,
          },
           {
            label: "Sub Department",
            data: sub_departments,
            value: selectedSubDepartments,
            onChange: setSelectedSubDepartments,
          },
          {
            label: "Employer",
            data: employers,
            value: selectedEmployers,
            onChange: setSelectedEmployers,
          },
          {
            label: "Position",
            data: positions,
            value: selectedPositions,
            onChange: setSelectedPositions,
            disabled: !selectedDepartments,
          },
        ].map(({ label, data, value, onChange, disabled }) => (
          <View key={label}>
            <Text style={styles.label}>{label}</Text>
            <Dropdown
              data={data}
              labelField="label"
              valueField="value"
              placeholder={`Select ${label}`}
              value={value}
              onChange={(item) => onChange(item.value)}
              style={styles.dropdown}
              disable={disabled}
            />
          </View>
        ))}

        {/* Entry Scan */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.label}>Entry Scan</Text>
          <Dropdown
            data={[
              { label: "All", value: "All" },
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
            ]}
            labelField="label"
            valueField="value"
            placeholder="Select Entry Scan"
            value={entryScan}
            onChange={(item) => setEntryScan(item.value)}
            style={styles.dropdown}
          />
        </View>

        {/* Schedule */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.label}>Schedule</Text>
          <Dropdown
            style={styles.dropdown}
            data={schedules}
            labelField="label"
            valueField="value"
            placeholder="Select Schedule"
            value={selectedSchedule}
            onChange={(item) => setSelectedSchedule(item.value)}
          />
        </View>

        {/* View Report Button */}
        <Button title="View Report" onPress={handleViewReport} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
});

export default EmployeeAttendanceScreen;
