import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialIcons";
import { Dropdown } from "react-native-element-dropdown";
import { getGBranch, getGAccessSubBranch, getGName } from "../GlobalVariable";
import { url, headers } from "../api/httpclient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const CATEGORY_OPTIONS = [
  { label: "SL", value: "SL" },
  { label: "AWOL", value: "AWOL" },
  { label: "No Info", value: "No Info" },
  { label: "OthersP", value: "OthersP" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// MOVED OUT of AbsentAutoScreen + wrapped in React.memo.
// Hindi na ito nare-recreate kada render ng parent, kaya hindi na
// nawawala ang focus ng TextInput kada titik na i-type sa Reason.
const RenderItem = React.memo(({ item, onToggleCheck, onUpdateField }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => onToggleCheck(item.aa_id)}
    style={[styles.card, item.checked && styles.cardSelected]}
  >
    <View style={styles.cardTopRow}>
      <Icon
        name={item.checked ? "check-circle" : "radio-button-unchecked"}
        size={24}
        color={item.checked ? "#0078d4" : "#c0c5cc"}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.nameText}>{item.employee_name}</Text>
        <Text style={styles.subText}>{item.position}</Text>
        <Text style={styles.subText}>{item.department}</Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.infoGrid}>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>DATE ABSENT</Text>
        <Text style={styles.infoValue}>{formatDate(item.date_absent)}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>SCHEDULE</Text>
        <Text style={styles.infoValue}>{item.eschedule || "-"}</Text>
      </View>
      <View style={[styles.infoBlock, { flexBasis: "100%" }]}>
        <Text style={styles.infoLabel}>SCHEDULE NEXT DAY</Text>
        <Text style={styles.infoValue}>{item.next_eschedule || "-"}</Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View onStartShouldSetResponder={() => true}>
      <Text style={styles.fieldLabel}>Category</Text>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.dropdownPlaceholder}
        selectedTextStyle={styles.dropdownSelectedText}
        data={CATEGORY_OPTIONS}
        labelField="label"
        valueField="value"
        placeholder="Select category"
        value={item.category}
        onChange={(val) => onUpdateField(item.aa_id, "category", val.value)}
      />

      <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Reason</Text>
      <TextInput
        style={styles.reasonInput}
        placeholder="Enter reason..."
        placeholderTextColor="#9aa0a6"
        value={item.reason}
        onChangeText={(text) => onUpdateField(item.aa_id, "reason", text)}
        multiline
      />
    </View>
  </TouchableOpacity>
));

const AbsentAutoScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employers, setEmployers] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState("All");
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const branch = getGBranch();
      const subBranch = getGAccessSubBranch();

      const apiUrl = `${url}/employeeschedule/absent/auto?branch=${encodeURIComponent(
        branch,
      )}&sub_branch=${encodeURIComponent(subBranch)}`;

      const response = await fetch(apiUrl, { method: "GET", headers });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();

      const mapped = Array.isArray(data)
        ? data.map((item) => ({
            ...item,
            checked: false,
            category: item.category || "",
            reason: item.reason || "",
          }))
        : [];

      setRecords(mapped);
      setSelectAll(false);

      const employerSet = new Set(mapped.map((r) => r.employer));
      setEmployers(["All", ...Array.from(employerSet).sort()]);
    } catch (error) {
      console.error("Fetch auto-absent error:", error);
      Alert.alert("Error", "Failed to fetch auto-absent records.");
      setRecords([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const filteredRecords = records.filter((r) => {
    const matchesEmployer =
      selectedEmployer === "All" || r.employer === selectedEmployer;
    const matchesSearch = r.employee_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesEmployer && matchesSearch;
  });

  const selectedCount = records.filter((r) => r.checked).length;

  // WRAPPED in useCallback para stable ang reference na ipinapasa
  // sa RenderItem — bahagi ito ng pag-ayos sa re-render/focus-loss issue.
  const toggleCheck = useCallback((aa_id) => {
    setRecords((prev) =>
      prev.map((r) => (r.aa_id === aa_id ? { ...r, checked: !r.checked } : r)),
    );
  }, []);

  const updateField = useCallback((aa_id, field, value) => {
    setRecords((prev) =>
      prev.map((r) => (r.aa_id === aa_id ? { ...r, [field]: value } : r)),
    );
  }, []);

  const toggleSelectAll = () => {
    const newVal = !selectAll;
    setSelectAll(newVal);
    const visibleIds = new Set(filteredRecords.map((r) => r.aa_id));
    setRecords((prev) =>
      prev.map((r) =>
        visibleIds.has(r.aa_id) ? { ...r, checked: newVal } : r,
      ),
    );
  };

  const handleSubmit = async () => {
    const selectedRows = records.filter((r) => r.checked);

    if (selectedRows.length === 0) {
      Alert.alert(
        "No Selection",
        "Please select at least one absent record to submit.",
      );
      return;
    }

    for (const row of selectedRows) {
      if (!row.category || row.category.trim() === "") {
        Alert.alert(
          "Required Field",
          `Category is required for employee:\n\n${row.employee_name}`,
        );
        return;
      }
      if (!row.reason || row.reason.trim() === "") {
        Alert.alert(
          "Required Field",
          `Reason is required for employee:\n\n${row.employee_name}`,
        );
        return;
      }
    }

    Alert.alert(
      "Confirm Submission",
      `Are you sure you want to submit ${selectedRows.length} selected absent record(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => submitRecords(selectedRows) },
      ],
    );
  };

  const submitRecords = async (selectedRows) => {
    setSubmitting(true);
    try {
      for (const row of selectedRows) {
        const body = {
          EmployeeName: row.employee_name,
          EsId: row.es_id,
          EmpId: row.emp_id,
          ACategory: row.category,
          DayEschedule: row.eschedule,
          DayEscode: row.escode,
          AReason: row.reason,
          LeaveDuration: row.category === "SL" ? "Whole Day" : null,
          DayDate: row.date_absent,
          CreatedBy: getGName(),
          ModifiedBy: getGName(),
        };

        const response = await fetch(`${url}/employeeschedule/absent`, {
          method: "PUT",
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          Alert.alert(
            "Submission Failed",
            `Failed to submit for ${row.employee_name}.\n\nDetails:\n${errText}\n\nThe remaining selected records were not submitted.`,
          );
          setSubmitting(false);
          return;
        }
      }

      Alert.alert(
        "Success",
        `Successfully submitted ${selectedRows.length} absent record(s).`,
      );
      fetchData();
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Error", "Network error while submitting absent records.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <Icon
          name="search"
          size={20}
          color="#9aa0a6"
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employee name..."
          placeholderTextColor="#9aa0a6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="close" size={20} color="#9aa0a6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Employer Tabs */}
      <View style={styles.tabRow}>
        {employers.map((emp) => {
          const count =
            emp === "All"
              ? records.length
              : records.filter((r) => r.employer === emp).length;
          const active = selectedEmployer === emp;
          return (
            <TouchableOpacity
              key={emp}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setSelectedEmployer(emp)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {emp}
                {emp !== "All" ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Select all + total */}
      <View style={styles.selectAllRow}>
        <TouchableOpacity
          style={styles.selectAllTouchable}
          onPress={toggleSelectAll}
        >
          <Icon
            name={selectAll ? "check-box" : "check-box-outline-blank"}
            size={20}
            color={selectAll ? "#0078d4" : "#9aa0a6"}
          />
          <Text style={styles.selectAllText}>Select All</Text>
        </TouchableOpacity>
        <Text style={styles.totalRowsText}>
          Total Rows: {filteredRecords.length}
          {selectedCount > 0 ? `  •  ${selectedCount} selected` : ""}
        </Text>
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={({ item }) => (
          <RenderItem
            item={item}
            onToggleCheck={toggleCheck}
            onUpdateField={updateField}
          />
        )}
        keyExtractor={(item) => item.aa_id.toString()}
        contentContainerStyle={{
          paddingBottom: 90 + insets.bottom,
          paddingTop: 4,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchData}
            colors={["#0078d4"]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="event-available" size={48} color="#c0c5cc" />
            <Text style={styles.emptyText}>No absent records found.</Text>
          </View>
        )}
      />

      {/* Floating submit bar */}
      <View style={[styles.submitBar, { paddingBottom: 12 + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f4f7",
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e5e9",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
    padding: 0,
  },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#f2f4f7",
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e5e9",
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: "#0078d4",
    borderColor: "#0078d4",
  },
  tabText: {
    fontSize: 13,
    color: "#4a4f57",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eceef1",
  },
  selectAllTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#4a4f57",
  },
  totalRowsText: {
    fontSize: 12,
    color: "#8a8f98",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginHorizontal: 14,
    marginVertical: 7,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: "#0078d4",
    backgroundColor: "#f5faff",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  nameText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  subText: {
    fontSize: 12,
    color: "#8a8f98",
    marginTop: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#eef0f3",
    marginVertical: 12,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoBlock: {
    flexBasis: "50%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9aa0a6",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: "#2b2f36",
    fontWeight: "500",
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4a4f57",
    marginBottom: 6,
  },
  dropdown: {
    height: 42,
    borderWidth: 1,
    borderColor: "#dcdfe4",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fafbfc",
  },
  dropdownPlaceholder: {
    fontSize: 13,
    color: "#9aa0a6",
  },
  dropdownSelectedText: {
    fontSize: 13,
    color: "#1a1a1a",
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#dcdfe4",
    borderRadius: 8,
    padding: 10,
    minHeight: 44,
    textAlignVertical: "top",
    fontSize: 13,
    color: "#1a1a1a",
    backgroundColor: "#fafbfc",
  },

  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: "#9aa0a6",
  },

  submitBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eceef1",
  },
  submitButton: {
    backgroundColor: "#0078d4",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default AbsentAutoScreen;
