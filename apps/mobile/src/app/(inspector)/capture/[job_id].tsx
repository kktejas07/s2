import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Image, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";

import * as outbox from "../../../offline/outbox";
import { drain, subscribe } from "../../../offline/sync";

/**
 * Capture on site.
 *
 * This screen said "coming soon". It is the one screen the whole mobile app
 * exists for, and it has to work with no signal, because a site usually has
 * none.
 *
 * Nothing here talks to the API. Capture writes to the outbox and returns; the
 * sync worker sends it when there is a network. The inspector's confirmation
 * is that the item is saved on the phone, which is a promise the app can
 * actually keep standing in a basement.
 */
export default function CaptureScreen() {
  const { job_id } = useLocalSearchParams<{ job_id: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);

  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState({ pending: 0, failed: 0, blocked: 0, sent: 0 });
  const [fix, setFix] = useState<Location.LocationObject | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const refresh = useCallback(async () => {
    setQueue(await outbox.counts());
  }, []);

  useEffect(() => {
    void refresh();
    return subscribe(() => void refresh());
  }, [refresh]);

  // Ask once, up front. Asking at the moment of capture puts a permission
  // dialog between the inspector and the photograph they are standing in
  // front of.
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationDenied(true);
        return;
      }
      try {
        setFix(
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
        );
      } catch {
        // No fix indoors. The photograph is still worth capturing.
      }
    })();
  }, []);

  const take = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const shot = await camera.current.takePictureAsync({ quality: 0.7 });
      if (shot?.uri) setPreview(shot.uri);
    } catch {
      Alert.alert("Camera", "That photograph could not be taken. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      // A fresh fix at the moment of saving, where one is available: the one
      // taken when the screen opened may be from a different part of the site.
      let position = fix;
      if (!locationDenied) {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => fix);
      }

      await outbox.enqueue({
        kind: "EVIDENCE",
        entityType: "job",
        entityId: String(job_id),
        fileName: `capture-${Date.now()}.jpg`,
        contentType: "image/jpeg",
        sourceUri: preview,
        payload: {
          kind: "PHOTO",
          caption: caption.trim(),
          captured_at: new Date().toISOString(),
          job_id: String(job_id),
          ...(position
            ? {
                captured_latitude: position.coords.latitude,
                captured_longitude: position.coords.longitude,
                captured_accuracy_m: position.coords.accuracy ?? undefined,
              }
            : {}),
        },
      });

      setPreview(null);
      setCaption("");
      await refresh();
      // Try immediately in case there is signal, but the save already stands
      // whether or not this does anything.
      void drain();
    } catch {
      Alert.alert(
        "Not saved",
        "The photograph could not be written to this phone. Check storage space and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="mb-2 text-lg font-bold text-slate-900">
          Camera access needed
        </Text>
        <Text className="mb-5 text-center text-slate-600">
          Photographs are the evidence behind an inspection report. Without the
          camera this screen cannot do anything.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="rounded-xl bg-[#0084bf] px-5 py-3"
        >
          <Text className="font-semibold text-white">Allow the camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="p-4">
        <Text className="text-2xl font-bold text-slate-900">Capture</Text>
        <Text className="mt-0.5 text-slate-500">{job_id}</Text>

        <QueueBanner queue={queue} />

        {preview ? (
          <View className="mt-4">
            <Image
              source={{ uri: preview }}
              className="h-72 w-full rounded-2xl bg-slate-100"
              resizeMode="cover"
            />
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="What this shows, and where"
              multiline
              className="mt-3 min-h-[64px] rounded-xl border border-slate-200 p-3 text-slate-900"
            />
            <Text className="mt-2 text-xs text-slate-400">
              {fix
                ? `Location ${fix.coords.latitude.toFixed(5)}, ${fix.coords.longitude.toFixed(5)}` +
                  (fix.coords.accuracy
                    ? ` to about ${Math.round(fix.coords.accuracy)}m`
                    : "")
                : locationDenied
                ? "No location — permission was declined"
                : "No location fix yet"}
            </Text>

            <View className="mt-3 flex-row gap-2">
              <TouchableOpacity
                onPress={save}
                disabled={busy}
                className="flex-1 items-center rounded-xl bg-[#0084bf] py-3.5"
              >
                <Text className="font-semibold text-white">
                  {busy ? "Saving…" : "Save to this phone"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreview(null)}
                disabled={busy}
                className="items-center rounded-xl border border-slate-200 px-5 py-3.5"
              >
                <Text className="font-semibold text-slate-700">Retake</Text>
              </TouchableOpacity>
            </View>
            <Text className="mt-2 text-center text-xs text-slate-400">
              Saved on the phone first, and sent when there is a signal.
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            <View className="h-96 overflow-hidden rounded-2xl bg-black">
              <CameraView ref={camera} style={{ flex: 1 }} facing="back" />
            </View>
            <TouchableOpacity
              onPress={take}
              disabled={busy}
              className="mt-3 items-center rounded-xl bg-[#0084bf] py-4"
            >
              <Text className="text-base font-semibold text-white">
                {busy ? "…" : "Take the photograph"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/**
 * What is still on the phone.
 *
 * Shown even when the queue is empty and everything has sent, because the
 * inspector's real question at the end of a day is "has my work left this
 * phone", and silence does not answer it.
 */
function QueueBanner({
  queue,
}: {
  queue: { pending: number; failed: number; blocked: number; sent: number };
}) {
  const waiting = queue.pending + queue.failed;

  if (queue.blocked > 0) {
    return (
      <View className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
        <Text className="font-semibold text-rose-900">
          {queue.blocked} item{queue.blocked === 1 ? "" : "s"} the server refused
        </Text>
        <Text className="mt-0.5 text-sm text-rose-800">
          These will not send on their own. Open the queue to see why.
        </Text>
      </View>
    );
  }
  if (waiting > 0) {
    return (
      <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <Text className="font-semibold text-amber-900">
          {waiting} item{waiting === 1 ? "" : "s"} waiting to send
        </Text>
        <Text className="mt-0.5 text-sm text-amber-800">
          Saved on this phone. They go up by themselves when there is a signal.
        </Text>
      </View>
    );
  }
  return (
    <View className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <Text className="font-semibold text-emerald-900">
        Everything has been sent
      </Text>
      <Text className="mt-0.5 text-sm text-emerald-800">
        Nothing is waiting on this phone.
      </Text>
    </View>
  );
}
