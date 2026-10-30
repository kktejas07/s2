import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../../../api/client";

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expenseType, setExpenseType] = useState("travel");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [findingDesc, setFindingDesc] = useState("");
  const [findingSev, setFindingSev] = useState("observation");
  const [reportNo, setReportNo] = useState("");
  const [visitComment, setVisitComment] = useState("");
  const [aiReport, setAiReport] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any>(null);

  useEffect(() => { loadVisit(); }, [id]);

  async function loadVisit() {
    const v = await api.getVisit(id!);
    setVisit(v);
    setReportNo(v.inspection_report_no || "");
    setVisitComment(v.comments || "");
    setLoading(false);
  }

  if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>;
  if (!visit) return <View className="flex-1 justify-center items-center"><Text>Visit not found</Text></View>;

  const canAccept = visit.status === "scheduled";
  const canCapture = ["initiated", "in_progress"].includes(visit.status);
  const canQc = visit.status === "completed";
  const totalExpense = (visit.expenses || []).reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0);

  async function handleAccept() {
    await api.acceptVisit(visit.visit_id);
    Alert.alert("Accepted", "Visit has been accepted");
    loadVisit();
  }

  async function handleSubmit() {
    await api.submitVisit(visit.visit_id, { inspection_report_no: reportNo, comments: visitComment });
    Alert.alert("Submitted", "Visit data submitted for QC");
    loadVisit();
  }

  async function handleAddExpense() {
    await api.addExpense(visit.visit_id, { expense_id: `EXP-${Date.now()}`, type: expenseType, amount: parseFloat(expenseAmount) || 0, description: expenseDesc });
    setExpenseAmount(""); setExpenseDesc("");
    loadVisit();
  }

  async function handleAddFinding() {
    await api.addFinding(visit.visit_id, { finding_id: `F-${Date.now()}`, description: findingDesc, severity: findingSev, category: "visual" });
    setFindingDesc("");
    loadVisit();
  }

  async function handleQC(status: string) {
    await api.qualityCheck(visit.visit_id, { status, comments: "" });
    Alert.alert("QC Done", `Quality check ${status}`);
    loadVisit();
  }

  async function handleGenerateReport() {
    const r = await api.generateReport(visit.visit_id);
    setAiReport(r);
    Alert.alert("Report Generated", "AI inspection report is ready");
  }

  async function handleAnomalyCheck() {
    const a = await api.detectAnomalies(visit.visit_id);
    setAnomalies(a);
    if (a?.flags?.length > 0) {
      Alert.alert("⚠️ Anomalies Found", `${a.flags.length} issue(s) detected`);
    } else {
      Alert.alert("✅ All Clear", "No anomalies detected");
    }
  }

  const tabs = ["overview", "expenses", "findings", "ai"];

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* Header */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold">{visit.visit_id}</Text>
          <Text className={`text-xs px-3 py-1 rounded ${visit.status === "scheduled" ? "bg-gray-200" : visit.status === "completed" ? "bg-green-200" : "bg-blue-200"}`}>{visit.status}</Text>
        </View>
        <Text className="text-gray-500 mt-1">Inspector: {visit.inspector_name || "Unassigned"}</Text>
      </View>

      {/* Quick Actions */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {canAccept && <TouchableOpacity onPress={handleAccept} className="bg-green-600 px-4 py-3 rounded-xl flex-1"><Text className="text-white text-center font-bold">✓ Accept Visit</Text></TouchableOpacity>}
        <TouchableOpacity onPress={handleGenerateReport} className="bg-purple-600 px-4 py-3 rounded-xl flex-1"><Text className="text-white text-center font-bold">🤖 AI Report</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleAnomalyCheck} className="bg-orange-500 px-4 py-3 rounded-xl flex-1"><Text className="text-white text-center font-bold">🔍 Check</Text></TouchableOpacity>
      </View>

      {/* Anomaly Alerts */}
      {anomalies?.flags?.length > 0 && (
        <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-4">
          <Text className="font-bold text-red-700 mb-1">🚨 Anomalies Detected</Text>
          {anomalies.flags.map((f: any, i: number) => (
            <Text key={i} className="text-red-600 text-sm">• {f.detail}</Text>
          ))}
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200 mb-4">
        {tabs.map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} className={`mr-4 pb-2 ${activeTab === tab ? "border-b-2 border-blue-600" : ""}`}>
            <Text className={`text-sm ${activeTab === tab ? "text-blue-600 font-bold" : "text-gray-500"}`}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "overview" && (
        <View>
          <View className="bg-white p-4 rounded-xl mb-4">
            <Text className="font-bold mb-2">Visit Details</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between"><Text className="text-gray-500">Planned Date</Text><Text>{visit.planned_date ? new Date(visit.planned_date).toLocaleDateString() : "—"}</Text></View>
              <View className="flex-row justify-between"><Text className="text-gray-500">Control No</Text><Text>{visit.control_number_id || "—"}</Text></View>
              <View className="flex-row justify-between"><Text className="text-gray-500">Report No</Text><Text>{visit.inspection_report_no || "—"}</Text></View>
              <View className="flex-row justify-between"><Text className="text-gray-500">Total Expenses</Text><Text className="font-bold">₹{totalExpense.toLocaleString()}</Text></View>
              <View className="flex-row justify-between"><Text className="text-gray-500">QC Status</Text><Text>{visit.quality_check_status || "pending"}</Text></View>
              <View className="flex-row justify-between"><Text className="text-gray-500">Finance</Text><Text>{visit.finance_status || "pending"}</Text></View>
            </View>
          </View>

          {/* Capture Form */}
          {canCapture && (
            <View className="bg-white p-4 rounded-xl mb-4 border-2 border-yellow-200">
              <Text className="font-bold text-yellow-700 mb-3">Capture Visit Data</Text>
              <TextInput value={reportNo} onChangeText={setReportNo} placeholder="Inspection Report No" className="border border-gray-300 p-3 rounded-xl mb-2" />
              <TextInput value={visitComment} onChangeText={setVisitComment} placeholder="Comments" multiline numberOfLines={3} className="border border-gray-300 p-3 rounded-xl mb-3" style={{ minHeight: 60 }} />
              <TouchableOpacity onPress={handleSubmit} className="bg-green-600 p-3 rounded-xl"><Text className="text-white text-center font-bold">Submit Visit</Text></TouchableOpacity>
            </View>
          )}

          {/* QC Form */}
          {canQc && (
            <View className="bg-white p-4 rounded-xl mb-4 border-2 border-purple-200">
              <Text className="font-bold text-purple-700 mb-3">Quality Check</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => handleQC("approved")} className="flex-1 bg-purple-600 p-3 rounded-xl"><Text className="text-white text-center font-bold">✓ Approve</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleQC("rejected")} className="flex-1 bg-red-500 p-3 rounded-xl"><Text className="text-white text-center font-bold">✗ Reject</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {activeTab === "expenses" && (
        <View className="bg-white p-4 rounded-xl">
          <Text className="font-bold mb-3">Expenses</Text>
          {canCapture && (
            <View className="mb-4 p-3 bg-gray-50 rounded-xl">
              <View className="flex-row gap-2 mb-2">
                {["travel", "food", "hotel", "mileage", "other"].map(t => (
                  <TouchableOpacity key={t} onPress={() => setExpenseType(t)} className={`px-3 py-1.5 rounded ${expenseType === t ? "bg-blue-600" : "bg-white border"}`}>
                    <Text className={`text-xs ${expenseType === t ? "text-white" : "text-gray-600"}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput value={expenseAmount} onChangeText={setExpenseAmount} placeholder="Amount" keyboardType="numeric" className="border border-gray-300 p-3 rounded-xl mb-2" />
              <TextInput value={expenseDesc} onChangeText={setExpenseDesc} placeholder="Description" className="border border-gray-300 p-3 rounded-xl mb-2" />
              <TouchableOpacity onPress={handleAddExpense} className="bg-blue-600 p-3 rounded-xl"><Text className="text-white text-center font-bold">Add Expense</Text></TouchableOpacity>
            </View>
          )}
          {(visit.expenses || []).map((e: any) => (
            <View key={e.expense_id} className="flex-row justify-between p-3 border-b border-gray-100">
              <Text className="text-sm">{e.type}</Text>
              <Text className="text-sm flex-1 ml-2">{e.description || ""}</Text>
              <Text className="font-mono font-bold">₹{parseFloat(e.amount).toLocaleString()}</Text>
            </View>
          ))}
          <View className="flex-row justify-between p-3 mt-2 border-t-2 border-gray-200">
            <Text className="font-bold">Total</Text>
            <Text className="font-bold font-mono">₹{totalExpense.toLocaleString()}</Text>
          </View>
        </View>
      )}

      {activeTab === "findings" && (
        <View className="bg-white p-4 rounded-xl">
          <Text className="font-bold mb-3">Findings</Text>
          {canCapture && (
            <View className="mb-4 p-3 bg-gray-50 rounded-xl">
              <View className="flex-row gap-2 mb-2">
                {["observation", "minor", "major", "critical"].map(s => (
                  <TouchableOpacity key={s} onPress={() => setFindingSev(s)} className={`px-3 py-1.5 rounded ${findingSev === s ? "bg-blue-600" : "bg-white border"}`}>
                    <Text className={`text-xs ${findingSev === s ? "text-white" : "text-gray-600"}`}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput value={findingDesc} onChangeText={setFindingDesc} placeholder="Describe the finding..." multiline numberOfLines={3} className="border border-gray-300 p-3 rounded-xl mb-2" style={{ minHeight: 60 }} />
              <TouchableOpacity onPress={handleAddFinding} className="bg-blue-600 p-3 rounded-xl"><Text className="text-white text-center font-bold">Add Finding</Text></TouchableOpacity>
            </View>
          )}
          {(visit.findings || []).map((f: any) => (
            <View key={f.finding_id} className={`p-3 mb-2 rounded-xl border-l-4 ${f.severity === "critical" ? "border-red-500 bg-red-50" : f.severity === "major" ? "border-orange-500 bg-orange-50" : f.severity === "minor" ? "border-yellow-500 bg-yellow-50" : "border-blue-500 bg-blue-50"}`}>
              <View className="flex-row justify-between"><Text className="font-bold text-xs uppercase">{f.severity}</Text>{f.ai_suggested && <Text className="text-xs text-purple-600">AI</Text>}</View>
              <Text className="text-sm mt-1">{f.description}</Text>
            </View>
          ))}
        </View>
      )}

      {activeTab === "ai" && (
        <View className="bg-white p-4 rounded-xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold">AI Inspection Report</Text>
            <TouchableOpacity onPress={handleGenerateReport} className="bg-purple-600 px-4 py-2 rounded-xl"><Text className="text-white text-sm font-bold">Generate</Text></TouchableOpacity>
          </View>
          {aiReport ? (
            <View>
              <View className="flex-row gap-2 mb-4">
                <View className="bg-purple-50 p-3 rounded-xl flex-1"><Text className="text-xs text-purple-600">Photos</Text><Text className="text-lg font-bold">{aiReport.photos_count || 0}</Text></View>
                <View className="bg-blue-50 p-3 rounded-xl flex-1"><Text className="text-xs text-blue-600">Findings</Text><Text className="text-lg font-bold">{aiReport.findings_count || 0}</Text></View>
                <View className="bg-green-50 p-3 rounded-xl flex-1"><Text className="text-xs text-green-600">Expenses</Text><Text className="text-lg font-bold">₹{aiReport.expenses_total || 0}</Text></View>
              </View>
              <Text className="text-xs text-gray-400">Generated: {new Date(aiReport.generated_at).toLocaleString()}</Text>
            </View>
          ) : (
            <View className="py-8"><Text className="text-gray-400 text-center">Tap "Generate" to create an AI report</Text></View>
          )}
        </View>
      )}

      {visit.comments && <View className="bg-gray-100 p-4 rounded-xl mt-4"><Text className="font-bold text-sm mb-1">Inspector Comments</Text><Text className="text-gray-600">{visit.comments}</Text></View>}
    </ScrollView>
  );
}
