import React, { useState, useCallback, useEffect } from 'react';
import { View, Alert, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from 'react-native';
import Icon from "@expo/vector-icons/MaterialIcons";
import { getGBranch, getGName } from "../GlobalVariable";
import { url, headers } from "../api/httpclient";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Spinner from "react-native-loading-spinner-overlay";

const HoldEmployeeScreen = ({ route }) => {
    const { category } = route.params;
    const navigation = useNavigation();

    const [pendingItems, setPendingItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]); // To store filtered data
    const [searchQuery, setSearchQuery] = useState(""); // Search state
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let title = '';
        switch (category) {
            case 'US':
                title = 'Hold Employee/s (Unscheduled)';
                break;
            default:
                title = 'Pending List';
        }

        navigation.setOptions({ title });
    }, [category, navigation]);

    // Fetch data function
    const fetchData = async () => {
        setIsRefreshing(true);
        const apiUrl = `${url}/employeeschedule/holdunschedule?branch=${getGBranch()}`;
        try {
            const response = await fetch(apiUrl, { method: "GET", headers: headers });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            const dataValues = data.map((item) => ({
                emp_id: item.emp_id,
                es_id: item.es_id,
                lst_id: item.lst_id,
                employee_name: item.employee_name,
                employer: item.employer,
                department: item.department,
                schedule: item.schedule,
            }));
            setPendingItems(dataValues);
            setFilteredItems(dataValues); // Initially, filtered items are the same as pending items
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Fetch data on mount and when the screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    // Handle search functionality
    const handleSearch = (query) => {
        setSearchQuery(query);

        // Filter pending items based on employee name or department
        const filteredData = pendingItems.filter(item => 
            item.employee_name.toLowerCase().includes(query.toLowerCase()) || 
            item.department.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredItems(filteredData); // Update filteredItems state
    };

    const handleUnhold = (item) => {
        Alert.alert(
            'Confirm Un-Hold',
            `Are you sure you want to un-hold ${item.employee_name}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    onPress: async () => {

                        setIsLoading(true);

                        const EmployeeScheduleList = [{
                            LstId: item.lst_id,
                            EmpId: item.emp_id,
                            EsId: item.es_id
                        }];

                        const EmployeeSchedule = {
                            Stat: category == 'FTW' ? 'ES Un-Hold (FTW)' : 'ES Un-Hold (Unscheduled)',
                            EsId: item.es_id,
                            ModifiedBy: getGName(),
                            EsTemp: JSON.stringify(EmployeeScheduleList)
                        };

                        try {
                            const response = await fetch(`${url}/employeeschedule`, {
                                method: "PUT",
                                headers: headers,
                                body: JSON.stringify(EmployeeSchedule),
                            });

                            if (response.ok) {
                                Alert.alert(
                                    'Un-Hold Successful',
                                    `${item.employee_name} has been successfully un-hold.`,
                                    [{ text: 'OK' }]
                                );
                                fetchData(); // Refresh data after un-hold
                            } else {
                                console.error("Request failed with status:", response.status);
                                const errorContent = await response.text();
                                console.error("Error content:", errorContent);
                                Alert.alert("Error", "Failed to un-hold.");
                            }
                        } catch (error) {
                            console.error("Network error:", error);
                            Alert.alert("Error", "Network error occurred.");
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // Render item function
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.itemContainer}
        >
            <View style={styles.iconContainer}>
                <Icon name="person" size={30} color="#fff" />
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.row}>
                    <Text style={styles.label}>Employee Name:</Text>
                    <Text style={styles.value}>{item.employee_name}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Employer:</Text>
                    <Text style={styles.value}>{item.employer}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Department:</Text>
                    <Text style={styles.value}>{item.department}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Schedule:</Text>
                    <Text style={styles.value}>{item.schedule}</Text>
                </View>

                {/* Un-hold Button */}
                <TouchableOpacity
                    style={styles.unholdButton}
                    onPress={() => handleUnhold(item)}
                >
                    <Text style={styles.unholdButtonText}>Un-Hold</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search Input */}
            <TextInput
                style={styles.searchInput}
                placeholder="Search by Employee Name or Department"
                value={searchQuery}
                onChangeText={handleSearch} // Handle search input
            />

            <FlatList
                data={filteredItems} // Use filteredItems instead of pendingItems
                renderItem={renderItem}
                keyExtractor={(item) => item.emp_id}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={fetchData}
                    />
                }
            />
            <Spinner
                visible={isLoading}
                textContent={"Loading..."}
                textStyle={{ color: "#FFF" }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    searchInput: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        fontSize: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#0078d4',
        borderRadius: 5,
        marginBottom: 10,
        marginHorizontal: 15,
    },
    iconContainer: {
        marginRight: 15,
    },
    infoContainer: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
        flex: 1,
    },
    value: {
        fontSize: 14,
        color: '#fff',
        flex: 2,
    },
    unholdButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        marginTop: 10,
        alignItems: 'center',
        alignSelf: 'center',
    },
    unholdButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default HoldEmployeeScreen;
