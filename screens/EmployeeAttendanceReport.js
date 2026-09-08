import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import * as ScreenOrientation from "expo-screen-orientation";

const EmployeeAttendanceReport = () => {
  const route = useRoute();
  const { date, department, employer, attendanceData } = route.params;

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <ScrollView horizontal contentContainerStyle={styles.horizontalScroll}>
      <ScrollView contentContainerStyle={styles.verticalScroll}>
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.header}>Employee Attendance Report</Text>

          {/* Filters */}
          <View style={styles.filterRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.label}>Department:</Text>
            <Text style={styles.value}>{department || ""}</Text>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.label}>Employer:</Text>
            <Text style={styles.value}>{employer || ""}</Text>
          </View>

          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.col1]}>Department</Text>
            <Text style={[styles.cell, styles.col2]}>Employer</Text>
            <Text style={[styles.cell, styles.col3]}>Employee Name</Text>
            <Text style={[styles.cell, styles.col4]}>Position</Text>
            <Text style={[styles.cell, styles.col5]}>Schedule</Text>
            <Text style={[styles.cell, styles.col6]}>Time In</Text>
            <Text style={[styles.cell, styles.col7]}>Assigned Location</Text>
            <Text style={[styles.cell, styles.col8]}>Status</Text>
         <Text style={[styles.cell, styles.col9, styles.lastCell]}>Remarks</Text>
          </View>

          {/* Data Rows */}
          {attendanceData.length > 0 ? (
            attendanceData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.cell, styles.col1]}>{item.department}</Text>
                <Text style={[styles.cell, styles.col2]}>{item.employer}</Text>
                <Text style={[styles.cell, styles.col3]}>{item.employee_name}</Text>
                <Text style={[styles.cell, styles.col4]}>{item.position}</Text>
                <Text style={[styles.cell, styles.col5]}>{item.schedule}</Text>
                <Text style={[styles.cell, styles.col6]}>{item.time_in}</Text>
                <Text style={[styles.cell, styles.col7]}>{item.assigned_location}</Text>
                <Text style={[styles.cell, styles.col8]}>{item.status}</Text>
            <Text style={[styles.cell, styles.col9, styles.lastCell]}>
  {item.absent_remarks || "—"}
</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No attendance records found.</Text>
          )}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  horizontalScroll: { flexGrow: 1 },
  verticalScroll: { flexGrow: 1 },
  container: {
    padding: 20,
    backgroundColor: "#fff",
    minWidth: 1200,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  lastCell: {
  borderRightWidth: 0,
},

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    width: 100,
  },
  value: {
    fontSize: 16,
    backgroundColor: "#f2f2f2",
    padding: 5,
    borderRadius: 5,
    flex: 1,
  },
  tableHeader: {
    backgroundColor: "#ddd",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
  },
  cell: {
    fontSize: 13,
    padding: 5,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#000",
  },

  // Fixed widths per column
  col1: { width: 90 }, // Department
  col2: { width: 70 }, // Employer
  col3: { width: 170 }, // Employee Name
  col4: { width: 170 }, // Position
  col5: { width: 80 }, // Schedule
  col6: { width: 80 }, // Time In
  col7: { width: 100 }, // Assigned Location
  col8: { width: 70 }, // Status
  col9: { width: 320 }, // Remarks

  emptyText: {
    textAlign: "center",
    fontSize: 11,
    color: "#888",
    marginTop: 20,
  },
});

export default EmployeeAttendanceReport;
