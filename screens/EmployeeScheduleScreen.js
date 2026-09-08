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
  Alert,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  getGAccessSubDeptEs,
  getGBranch,
} from "../GlobalVariable";
import { url, headers } from "../api/httpclient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const EmployeescheduleScreen = () => {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [date, setDate] = useState(new Date()); // FROM (Monday)
  const [toDate, setToDate] = useState(null); // TO (Auto)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const formatDateYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getMondayFromDate = (date) => {
    const day = date.getDay(); // 0 = Sun, 1 = Mon
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    return monday;
  };

  const getSundayFromMonday = (monday) => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  };

  const fetchData = async () => {
  // 🔴 REQUIRED VALIDATION
  if (!date || !toDate) {
    Alert.alert(
      "Required Fields",
      "Please select coverage before searching."
    );
    return;
  }

  setIsRefreshing(true);
  setHasSearched(true);

  const apiUrl = `${url}/employeeschedule/mobile?branch=${'AGI-Calamba'}&coverage_date_from=${formatDateYYYYMMDD(
    date
  )}&coverage_date_to=${formatDateYYYYMMDD(
    toDate
  )}&access_sub_dept=${getGAccessSubDeptEs()}&access_sub_branch=${getGBranch()}`;


  try {
    const response = await fetch(apiUrl, { method: "GET", headers });
    if (!response.ok)
      throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      setEmployees(data);
    } else {
      setEmployees([]);
    }
  } catch (error) {
    console.error("Data fetching error:", error);
    Alert.alert(
      "Error",
      "Failed to fetch data. Check your network or settings."
    );
    setEmployees([]);
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


  // ---- RenderItem 
  const RenderItem = ({ item }) => {
 
    return (
      <>
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() =>  navigation.navigate("ReviseSchedule", {
        lst_id: item.lst_id,
        department: item.department
      })}
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
              <Text style={styles.value}>{item.emp_position}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </>
    );
  };

  // ---- UI ----
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterContainer}>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Coverage From</Text>
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
                  if (!selectedDate) return;

                  // 🔁 Convert selected date to Monday
                  const monday = getMondayFromDate(selectedDate);

                  setDate(monday); // FROM
                  setToDate(getSundayFromMonday(monday)); // TO (Auto)
                }}
              />
            )}
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>To</Text>
            <View style={[styles.input, { backgroundColor: "#eee" }]}>
              <Text>{toDate ? formatDateYYYYMMDD(toDate) : "--"}</Text>
            </View>
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

  searchBar: {
    borderWidth: 1,
    borderColor: "#ddd",
    margin: 10,
    padding: 8,
    borderRadius: 8,
  },
});

export default EmployeescheduleScreen;
