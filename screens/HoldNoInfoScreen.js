import React, { useState, useCallback, useEffect } from "react";
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
} from "../GlobalVariable";
import { url, headers } from "../api/httpclient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";


const HoldNoInfoScreen = ({ route }) => {
  const navigation = useNavigation();
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState("All");
  const [employers, setEmployers] = useState([]);

  useEffect(() => {
    navigation.setOptions({ title: "No Info" });
  }, [navigation]);

  const fetchData = async () => {
    setIsRefreshing(true);
    const apiUrl = `${url}/employeeschedule/holdnoinfo?branch=${getGBranch()}`;

    try {
      const response = await fetch(apiUrl, { method: "GET", headers });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setAllEmployees(data);
      setFilteredEmployees(data);

      const employerSet = new Set(data.map((emp) => emp.employer));
      setEmployers(["All", ...Array.from(employerSet)]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      setSearchQuery("");
    }, [])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    const lower = text.toLowerCase();
    const filtered = allEmployees.filter(
      (item) =>
        item.employee_name.toLowerCase().includes(lower) &&
        (selectedEmployer === "All" || item.employer === selectedEmployer)
    );
    setFilteredEmployees(filtered);
  };

  const handleEmployerFilter = (employer) => {
    setSelectedEmployer(employer);
    const filtered = allEmployees.filter(
      (item) =>
        item.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (employer === "All" || item.employer === employer)
    );
    setFilteredEmployees(filtered);
  };

  const RenderItem = React.memo(({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() =>
        navigation.navigate("NIABSENT", {
          emp_id: item.emp_id
        })
      }
    >
      <View style={styles.iconContainer}>
                  <Icon name="person" size={30} color="#fff" />
                </View>
          
                <View style={styles.infoContainer}>
                  <Text style={styles.value}>{item.employee_name}</Text>
                  <Text style={styles.sub}>{item.department}</Text>
                  <Text style={styles.sub}>{item.position}</Text>
                </View>
    </TouchableOpacity>
  ));

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by Employee Name"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <View style={styles.filterRow}>
        {employers.sort((a, b) => {
      if (a.toLowerCase() === 'all') return -1;
      if (b.toLowerCase() === 'all') return 1;
      return a.localeCompare(b);
    }).map((emp) => (
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
        keyExtractor={(item) => item.emp_id.toString()}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No employees found.</Text>
          </View>
        }
      />
    </View>
  );
};

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
    marginBottom: 10,
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
    alignItems: "center",
    padding: 10,
    backgroundColor: "#0078d4",
    borderRadius: 5,
    marginHorizontal: 10,
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 10,
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
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
    width: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default HoldNoInfoScreen;
