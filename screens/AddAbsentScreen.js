import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  TextInput,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  getGBranch,
  getGAccessSubBranch,
  getGAccessDeptEs,
  getGDepartment,
  getGAccessModule,
  getGName, // NOTE: added — used by removeAbsent() below but wasn't imported before
} from "../GlobalVariable";
import { url, headers } from "../api/httpclient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Dropdown } from "react-native-element-dropdown";

const AddAbsentScreen = () => {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState("All");
  const [selectedEmployer, setSelectedEmployer] = useState("All");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedEntryScan, setSelectedEntryScan] = useState("No");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [entryscan] = useState([
    { label: "All", value: "All" },
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
  ]);
  const accessModule = getGAccessModule();
  const dynamicOptions = [];

  if (accessModule?.includes("Plant Operation")) {
    dynamicOptions.push({ label: "Plant Operation", value: "Plant Operation" });
  }
  if (accessModule?.includes("Logistics")) {
    dynamicOptions.push({ label: "Logistics", value: "Logistics" });
  }
  const [categories, setcategory] = useState(dynamicOptions);
  const [selectedCategory, setSelectedCategory] = useState("");

  const formatDateYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const accessDept = getGAccessDeptEs();
        if (accessDept) {
          const deptList = accessDept.split(",").map((dept) => ({
            label: dept.trim(),
            value: dept.trim(),
          }));
          setDepartments([{ label: "All", value: "All" }, ...deptList]);
        }

        const subBranch = getGAccessSubBranch();
        if (subBranch) {
          const employerList = subBranch.split(",").map((emp) => ({
            label: emp.trim(),
            value: emp.trim(),
          }));
          setEmployers(
            getGDepartment() === "Outsource Agency"
              ? employerList
              : [{ label: "All", value: "All" }, ...employerList]
          );
        }

        // fetch schedules
        const response = await fetch(`${url}/eschedule?department=All`, {
          method: "GET",
          headers,
        });

        if (!response.ok) throw new Error("Failed to fetch schedule data");

        const data = await response.json();
        const scheduled = data.filter((item) => item.es_type === "Scheduled");
        setSchedules([
          { label: "All", value: "All" },
          ...scheduled.map((item) => ({
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

  const fetchData = async () => {
    setIsRefreshing(true);
    setHasSearched(true);

    const apiUrl = `${url}/employeeschedule/absent?branch=${getGBranch()}&access_subbranch=${getGAccessSubBranch()}&employer=${selectedEmployer}&date=${formatDateYYYYMMDD(
      date
    )}&schedule=${selectedSchedule}&department=${encodeURIComponent(
      selectedDepartment
    )}&entry_scan=${selectedEntryScan}&category=${selectedCategory}`;


    try {
      const response = await fetch(apiUrl, { method: "GET", headers });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
      } else {
        setEmployees([]); // Clear if empty
      }
    } catch (error) {
      console.error("Data fetching error:", error);
      setEmployees([]);
      Alert.alert("Error", "Failed to fetch data. Check your network or settings.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSearchQuery("");
    }, [])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const filteredData = employees.filter(
    (item) =>
      item.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeAbsent = async (emp_id, es_id, cancelledReason) => {
    try {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0"); // months are 0-based
      const year = date.getFullYear();

      const EmployeeAbsent = {
        EmpId: emp_id,
        DayDate: `${year}-${month}-${day}`, // YYYY-MM-DD in local time
        EsId: es_id,
        CancelledBy: getGName(),
        CancelledReason: cancelledReason,
      };

      const response = await fetch(`${url}/employeeschedule/absent/remove`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(EmployeeAbsent),
      });

      if (response.ok) {
        Alert.alert("Success", "Absent cancelled successfully.");
      } else {
        const text = await response.text();
        console.error("Remove failed:", response.status, text);
        Alert.alert("Error", "Failed to cancel absent.");
      }
    } catch (err) {
      console.error("removeAbsent error:", err);
      Alert.alert("Error", "Network error while cancelling absent.");
    }
  };

  // ---- RenderItem with modal choices (Add Absent / Remove Absent) ----
  const RenderItem = ({ item }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [reasonModalVisible, setReasonModalVisible] = useState(false); // NEW: reason input modal
    const [reasonInput, setReasonInput] = useState(""); // NEW: typed reason
    const [deleting, setDeleting] = useState(false);

    const handleAddAbsent = () => {
      setModalVisible(false);
      // Keep current behavior: navigate to ABSENT screen
      navigation.navigate("ABSENT", {
        date: item.date,
        department_code: item.department_code,
        lst_id: item.lst_id,
      });
    };

    // CHANGED: opens the reason modal instead of reading item.reason (which was never set)
    const handleRemoveAbsent = () => {
      setModalVisible(false);
      setReasonInput("");
      setReasonModalVisible(true);
    };

    // NEW: validates the reason, then confirms and calls removeAbsent
    const confirmRemoveAbsent = () => {
      const reason = reasonInput.trim();

      if (!reason) {
        Alert.alert("Reason Required", "Please enter a reason before removing the absence.");
        return;
      }

      setReasonModalVisible(false);

      Alert.alert(
        "Remove Absent",
        `Are you sure you want to remove absence for ${item.employee_name}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                setDeleting(true);
                await removeAbsent(item.emp_id, item.es_id, reason);
              } finally {
                setDeleting(false);
              }
            },
          },
        ]
      );
    };

    return (
      <>
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.iconContainer}>
            <Icon name="person" size={30} color="#fff" />
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.rowData}>
              <Text style={styles.label1}>Employee Name:</Text>
              <Text style={styles.value}>{item.employee_name}</Text>
            </View>
            <View style={styles.rowData}>
              <Text style={styles.label1}>Department:</Text>
              <Text style={styles.value}>{item.department_code}</Text>
            </View>
            <View style={styles.rowData}>
              <Text style={styles.label1}>Position:</Text>
              <Text style={styles.value}>{item.position}</Text>
            </View>
            <View style={styles.rowData}>
              <Text style={styles.label1}>Schedule:</Text>
              <Text style={styles.value}>{item.schedule}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Choose Action modal */}
        <Modal
          animationType="fade"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Action</Text>

              <Pressable style={styles.modalButtonAdd} onPress={handleAddAbsent}>
                <Text style={styles.modalText}>Add Absent</Text>
              </Pressable>

              <Pressable
                style={styles.modalButtonRemove}
                onPress={handleRemoveAbsent}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalText}>Remove Absent</Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.modalButton, { backgroundColor: "#777" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* NEW: Reason input modal — required before Remove Absent proceeds */}
        <Modal
          animationType="fade"
          transparent
          visible={reasonModalVisible}
          onRequestClose={() => setReasonModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reason for Removal</Text>

              <TextInput
                style={styles.reasonInput}
                placeholder="Enter reason..."
                placeholderTextColor="#aaa"
                value={reasonInput}
                onChangeText={setReasonInput}
                multiline
              />

              <Pressable
                style={styles.modalButtonRemove}
                onPress={confirmRemoveAbsent}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalText}>Confirm Remove</Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.modalButton, { backgroundColor: "#777" }]}
                onPress={() => setReasonModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.modalText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  // ---- UI ----
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterContainer}>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{formatDateYYYYMMDD(date)}</Text>
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
          </View>

          <View style={styles.column}>
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
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Employer</Text>
            <Dropdown
              style={styles.dropdown}
              data={employers}
              labelField="label"
              valueField="value"
              placeholder="Select Employer"
              value={selectedEmployer}
              onChange={(item) => setSelectedEmployer(item.value)}
            />
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Department</Text>
            <Dropdown
              style={styles.dropdown}
              data={departments}
              labelField="label"
              valueField="value"
              placeholder="Select Department"
              value={selectedDepartment}
              onChange={(item) => setSelectedDepartment(item.value)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Entry Scan</Text>
            <Dropdown
              style={styles.dropdown}
              data={entryscan}
              labelField="label"
              valueField="value"
              placeholder="Select Entry Scan"
              value={selectedEntryScan}
              onChange={(item) => setSelectedEntryScan(item.value)}
            />
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Category</Text>
            <Dropdown
              style={styles.dropdown}
              data={categories}
              labelField="label"
              valueField="value"
              placeholder="Select Category"
              value={selectedCategory}
              onChange={(item) => setSelectedCategory(item.value)}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={fetchData}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search by Employee Name or Department"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filteredData}
        renderItem={({ item }) => <RenderItem item={item} />}
        keyExtractor={(item) => item.lst_id.toString()}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
        }
        ListEmptyComponent={() =>
          hasSearched ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No records found.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    padding: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: "48%",
  },
  label: {
    marginBottom: 4,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: "#0078d4",
    padding: 12,
    borderRadius: 8,
    alignSelf: "center",
    width: "50%",
    marginTop: 10,
  },
  searchButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#0078d4",
    borderRadius: 6,
    marginHorizontal: 10,
    marginVertical: 6,
  },
  iconContainer: {
    marginRight: 12,
    backgroundColor: "#2b7de9",
    padding: 10,
    borderRadius: 40,
  },
  infoContainer: {
    flex: 1,
  },
  rowData: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label1: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
    width: 110,
  },
  value: {
    fontSize: 12,
    color: "#fff",
    flexShrink: 1,
  },

  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    padding: 18,
    borderRadius: 10,
    width: 300,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
  },
  modalButton: {
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 6,
  },
  modalButtonAdd: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 6,
  },
  modalButtonRemove: {
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 6,
  },
  modalText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    minHeight: 70,
    textAlignVertical: "top",
    color: "#fff",
    backgroundColor: "#2b2b2b",
  },

  searchBar: {
    borderWidth: 1,
    borderColor: "#ddd",
    margin: 10,
    padding: 8,
    borderRadius: 8,
  },
});

export default AddAbsentScreen;