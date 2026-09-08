import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from "react-native";
import Icon from "@expo/vector-icons/MaterialIcons";
import {
  getGBranch,
  getGAccessSubBranch,
  getGAccessSubDeptEs,
} from "../GlobalVariable";
import { url, headers } from "../api/httpclient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const AddCDRDOTScreen = () => {
  const navigation = useNavigation();

  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedEmployer, setSelectedEmployer] = useState("All");
  const [employers, setEmployers] = useState([]);

  const [selectedDateTab, setSelectedDateTab] = useState("Today");
  const dateTabs = ["Today", "Tomorrow"];

  /* -------------------- DATE HELPERS -------------------- */
  const isSameDate = (d1, d2) => {
    if (!d1) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

   const formatDate = (dateStr) => {
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${month}/${day}/${year}`; // MM/DD/YYYY
};


  /* -------------------- FILTER LOGIC -------------------- */
  const applyFilters = (employees, employer, search, dateTab) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const lowerSearch = search.toLowerCase();

  const filtered = employees.filter((item) => {
    const matchEmployer = employer === "All" || item.employer === employer;

    // Search matches either employee name or department
    const matchSearch =
      item.employee_name.toLowerCase().includes(lowerSearch) ||
      item.department.toLowerCase().includes(lowerSearch);

    const matchDate =
      dateTab === "All"
        ? true
        : dateTab === "Today"
        ? isSameDate(item.date, today)
        : isSameDate(item.date, tomorrow);

    return matchEmployer && matchSearch && matchDate;
  });

  // Sort by department first, then by employee name
  return filtered.sort((a, b) => {
    if (a.department < b.department) return -1;
    if (a.department > b.department) return 1;
    if (a.employee_name < b.employee_name) return -1;
    if (a.employee_name > b.employee_name) return 1;
    return 0;
  });
};


  /* -------------------- FETCH DATA -------------------- */
  const fetchData = async () => {
    setIsRefreshing(true);

    const apiUrl = `${url}/employeeschedule/cdrdot?branch=${getGBranch()}&access_subbranch=${getGAccessSubBranch()}&access_sub_dept=${getGAccessSubDeptEs()}`;

    try {
      const response = await fetch(apiUrl, { method: "GET", headers });
      if (!response.ok) throw new Error(`HTTP error`);

      const data = await response.json();
      setAllEmployees(data);

      const employerSet = new Set(data.map((x) => x.employer));
      const sortedEmployers = ["All", ...Array.from(employerSet).sort()];
      setEmployers(sortedEmployers);

      setFilteredEmployees(applyFilters(data, "All", "", "Today"));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      setSearchQuery("");
      setSelectedEmployer("All");
      setSelectedDateTab("Today");
    }, [])
  );

  /* -------------------- HANDLERS -------------------- */
  const handleSearch = (text) => {
    setSearchQuery(text);
    setFilteredEmployees(
      applyFilters(allEmployees, selectedEmployer, text, selectedDateTab)
    );
  };

  const handleEmployerFilter = (employer) => {
    setSelectedEmployer(employer);
    setFilteredEmployees(
      applyFilters(allEmployees, employer, searchQuery, selectedDateTab)
    );
  };

  const handleDateFilter = (tab) => {
    setSelectedDateTab(tab);
    setFilteredEmployees(
      applyFilters(allEmployees, selectedEmployer, searchQuery, tab)
    );
  };

  /* -------------------- LIST ITEM -------------------- */
  const RenderItem = React.memo(({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() =>
        navigation.navigate("CDRDOT", {
        department: item.department,
          department_code: item.department_code,
          lst_id: item.lst_id,
          date: item.date,
        })
      }
    >
      <View style={styles.iconContainer}>
        <Icon name="person" size={30} color="#fff" />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.value}>{item.employee_name}</Text>
        <Text style={styles.sub}>{item.department_code}</Text>
        <Text style={styles.sub}>{item.position}</Text>
        <Text style={styles.sub}>Schedule: {item.schedule}</Text>
         <Text style={styles.sub}> Date: {formatDate(item.date)}</Text>
      </View>
    </TouchableOpacity>
  ));

  /* -------------------- UI -------------------- */
  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by Employee Name or Department"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {/* DATE TABS */}
      <View style={styles.filterRow}>
        {dateTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterButton,
              selectedDateTab === tab && styles.activeButton,
            ]}
            onPress={() => handleDateFilter(tab)}
          >
            <Text style={styles.filterText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* EMPLOYER TABS */}
      <View style={styles.filterRow}>
        {employers.map((emp) => (
          <TouchableOpacity
            key={emp}
            style={[
              styles.filterButton,
              selectedEmployer === emp && styles.activeButton,
            ]}
            onPress={() => handleEmployerFilter(emp)}
          >
            <Text style={styles.filterText}>{emp}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredEmployees}
        renderItem={({ item }) => <RenderItem item={item} />}
        keyExtractor={(item) => item.lst_id.toString()}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No employees found</Text>
        }
      />
    </View>
  );
};

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    margin: 10,
    backgroundColor: "#fff",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  filterButton: {
    backgroundColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  activeButton: {
    backgroundColor: "#0078d4",
  },
  filterText: {
    color: "#fff",
    fontSize: 12,
  },
  itemContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#0078d4",
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 6,
  },
  iconContainer: {
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
  },
  value: {
    color: "#fff",
    fontWeight: "bold",
  },
  sub: {
    color: "#eaeaea",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#666",
  },
});

export default AddCDRDOTScreen;
