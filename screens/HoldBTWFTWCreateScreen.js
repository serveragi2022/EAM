import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput
} from "react-native";
import Icon from "@expo/vector-icons/MaterialIcons";
import {
  getGBranch,
  getGAccessDeptEs,
  getGAccessSubDeptEs,
} from "../GlobalVariable";
import { url, headers } from "../api/httpclient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

const Tab = createMaterialTopTabNavigator();

const HoldBTWFTWCreateScreen = ({ route }) => {
  const { category } = route.params;
  const navigation = useNavigation();
  const [pendingItems, setPendingItems] = useState({});
  const [filteredItems, setFilteredItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let title =
      category === "FW"
        ? "Request for Fit to Work"
        : "Request for Back to Work";
    navigation.setOptions({ title });
  }, [category, navigation]);

  const fetchData = async () => {
    setIsRefreshing(true);
    const apiUrl =
      category === "FW"
        ? `${url}/employeeschedule/holdftw/create?branch=${getGBranch()}`
        : `${url}/employeeschedule/holdbtw/create?branch=${getGBranch()}&access_department=${encodeURIComponent(
            setGAccessDeptEs()
          )}&access_sub_department=${encodeURIComponent(getGAccessSubDeptEs())}`;

    try {
      const response = await fetch(apiUrl, { method: "GET", headers: headers });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const groupedData = data.reduce((acc, item) => {
        if (!acc[item.employer]) acc[item.employer] = [];
        acc[item.employer].push({
          hold_id: category === "FW" ? item.fw_id : item.bw_id,
          emp_id: item.emp_id,
          employee_name: item.employee_name,
          employer: item.employer,
          department: item.department,
          position: item.position,
        });
        return acc;
      }, {});

      setPendingItems(groupedData);
      setFilteredItems(groupedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      setSearchQuery('')
    }, [])
  );

  // 🔹 Search Functionality
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredItems(pendingItems);
      return;
    }

    const lowerCaseText = text.toLowerCase();
    const newFilteredData = Object.keys(pendingItems).reduce(
      (acc, employer) => {
        const filteredEmployees = pendingItems[employer].filter(
          (item) =>
            item.employee_name.toLowerCase().includes(lowerCaseText) ||
            item.employer.toLowerCase().includes(lowerCaseText) ||
            item.department.toLowerCase().includes(lowerCaseText) ||
            item.position.toLowerCase().includes(lowerCaseText)
        );

        if (filteredEmployees.length > 0) {
          acc[employer] = filteredEmployees;
        }
        return acc;
      },
      {}
    );

    setFilteredItems(newFilteredData);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 🔍 Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search by Employee Name or Department or Position"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <Tab.Navigator screenOptions={{ tabBarScrollEnabled: true }} lazy={true} >
        {Object.keys(filteredItems).length > 0 ? (
          Object.entries(filteredItems).map(([employer, employees]) => (
            <Tab.Screen
              key={employer}
              name={`${employer} (${employees.length})`}
              children={() => (
                <EmployerTab employees={employees} category={category} />
              )}
            />
          ))
        ) : (
          <Tab.Screen name="No Employees" component={NoEmployeesScreen} />
        )}
      </Tab.Navigator>
    </View>
  );
};

const RenderItem = React.memo(({ item, navigation, category }) => {
  const targetScreen =
    category === "FW" ? "CreateFittoWork" : "CreateBacktoWork";
  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate(targetScreen, { item })}
    >
      <View style={styles.iconContainer}>
        <Icon name="person" size={30} color="#fff" />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.value}>{item?.employee_name || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>{item?.department || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Position:</Text>
          <Text style={styles.value}>{item?.position || "N/A"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const EmployerTab = ({ employees, category }) => {
  const navigation = useNavigation();
  return (
    <View marginRight={20} marginLeft={20}>
      <FlatList
        data={employees}
        renderItem={({ item }) => (
          <RenderItem item={item} navigation={navigation} category={category} />
        )}
        keyExtractor={(item) => item.hold_id.toString()}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
      />
    </View>
  );
};

// Screen to show when no employees exist
const NoEmployeesScreen = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No employees found.</Text>
  </View>
);

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
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#0078d4",
    borderRadius: 5,
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
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
  value: {
    fontSize: 12,
    color: "#fff",
    flexShrink: 1,
    numberOfLines: 1,
    ellipsizeMode: "tail",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default HoldBTWFTWCreateScreen;
