import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { useUserContext } from "~/components/context";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { showToast } from "~/components/ui/toast";
import { supabase } from "~/supabase-client";

interface MobileAttendanceProps {
    isOpen: boolean;
    onClose: () => void;
    blockId: string;
}

interface SessionStats {
    totalStudents: number;
    presentCount: number;
    duration?: string;
}

export function MobileAttendance(props: MobileAttendanceProps) {
    const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);
    const [stream, setStream] = createSignal<MediaStream | null>(null);
    const [ws, setWs] = createSignal<WebSocket | null>(null);
    const [isConnected, setIsConnected] = createSignal(false);
    const [isCameraActive, setIsCameraActive] = createSignal(false);
    const [isAuthorized, setIsAuthorized] = createSignal(false);
    const [sessionStats, setSessionStats] = createSignal<SessionStats>({
        totalStudents: 0,
        presentCount: 0,
    });
    const [isSessionActive, setIsSessionActive] = createSignal(false);
    const userContext = useUserContext();

    const stopCamera = () => {
        const mediaStream = stream();
        if (mediaStream) {
            for (const track of mediaStream.getTracks()) {
                track.stop();
                mediaStream.removeTrack(track);
            }
            setStream(null);
            setIsCameraActive(false);

            // Clear video source
            const video = videoRef();
            if (video) {
                video.srcObject = null;
            }
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            setStream(mediaStream);
            const video = videoRef();
            if (video) {
                video.srcObject = mediaStream;
                video.play().catch((error) => {
                    showToast({
                        variant: "destructive",
                        title: "Error",
                        description: `Unable to start video: ${error.message}`,
                    });
                });
            }
            setIsCameraActive(true);
        } catch (error) {
            showToast({
                variant: "destructive",
                title: "Error",
                description: `Unable to access camera: ${(error as Error).message}`,
            });
        }
    };

    const connectWebSocket = async () => {
        try {
            // Vérifier si l'utilisateur est connecté et a le rôle d'instructeur
            if (!userContext.user() || userContext.user()?.role !== "instructor") {
                showToast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Only instructors can use this feature",
                });
                return;
            }

            // Récupérer le token JWT de Supabase
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error || !session) {
                showToast({
                    variant: "destructive",
                    title: "Authentication Error",
                    description: "You must be logged in to use this feature",
                });
                return;
            }

            const token = session.access_token;
            console.log("Attempting to connect to WebSocket server...");

            // Établir la connexion WebSocket avec le token
            const socket = new WebSocket(`ws://localhost:8765?token=${token}`);

            // Gestionnaire d'événements pour les erreurs de connexion
            socket.onerror = (error) => {
                console.error("WebSocket connection error:", error);
                showToast({
                    variant: "destructive",
                    title: "Connection Error",
                    description: "Unable to connect to the server. Please check if the server is running.",
                });
            };

            // Gestionnaire d'événements pour la fermeture de connexion
            socket.onclose = (event) => {
                console.log("WebSocket connection closed:", event.code, event.reason);
                setIsConnected(false);
                setIsAuthorized(false);
                setIsSessionActive(false);

                let errorMessage = "WebSocket connection lost";
                if (event.code === 1015) {
                    errorMessage = "Connection error. Please check if the server is properly configured.";
                }

                showToast({
                    variant: "destructive",
                    title: "Disconnected",
                    description: errorMessage,
                });
            };

            // Gestionnaire d'événements pour l'ouverture de connexion
            socket.onopen = () => {
                console.log("WebSocket connection established");
                setIsConnected(true);
                setIsAuthorized(true);
            };

            // Gestionnaire d'événements pour les messages
            socket.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    console.log("Received message from server:", response);

                    if (response.status === "error") {
                        showToast({
                            variant: "destructive",
                            title: "Error",
                            description: response.message,
                        });
                        return;
                    }

                    if (response.status === "warning") {
                        showToast({
                            variant: "destructive",
                            title: "Warning",
                            description: response.message,
                        });
                        return;
                    }

                    if (response.status === "info") {
                        showToast({
                            title: "Information",
                            description: response.message,
                        });
                        return;
                    }

                    if (response.status === "success") {
                        if (response.data) {
                            if (response.data.total_students) {
                                // Session started
                                setSessionStats({
                                    totalStudents: response.data.total_students,
                                    presentCount: 0,
                                });
                                setIsSessionActive(true);
                                showToast({
                                    title: "Session Started",
                                    description: `${response.data.total_students} students to scan`,
                                });
                            } else if (response.data.attendance_count !== undefined) {
                                // Attendance recorded
                                setSessionStats((prev) => ({
                                    ...prev,
                                    presentCount: response.data.attendance_count,
                                }));
                                showToast({
                                    title: "Attendance Recorded",
                                    description: response.message,
                                });
                            } else if (response.data.duration) {
                                // Session ended
                                setSessionStats((prev) => ({
                                    ...prev,
                                    duration: response.data.duration,
                                    presentCount: response.data.attendance_count,
                                }));
                                setIsSessionActive(false);
                                showToast({
                                    title: "Session Ended",
                                    description: `Session ended : ${response.data.attendance_count}/${sessionStats().totalStudents} present in ${response.data.duration}`,
                                });
                            }
                        } else {
                            // Simple success message
                            showToast({
                                title: "Success",
                                description: response.message,
                            });
                        }
                    }
                } catch (e) {
                    console.error("Error parsing server response:", e);
                }
            };

            setWs(socket);
        } catch (error) {
            console.error("Error in connectWebSocket:", error);
            showToast({
                variant: "destructive",
                title: "Error",
                description: `Unable to establish connection: ${(error as Error).message}`,
            });
        }
    };

    const disconnectWebSocket = () => {
        const socket = ws();
        if (socket) {
            if (isSessionActive()) {
                socket.send(
                    JSON.stringify({
                        action: "end_attendance",
                    }),
                );
            }
            socket.close();
            setWs(null);
        }
    };

    const startSession = () => {
        const socket = ws();
        if (socket && isConnected() && isAuthorized()) {
            socket.send(
                JSON.stringify({
                    action: "start_attendance",
                    block_id: props.blockId,
                }),
            );
        }
    };

    createEffect(() => {
        if (props.isOpen) {
            connectWebSocket();
            startCamera();
        } else {
            stopCamera();
            disconnectWebSocket();
        }
    });

    // Cleanup when component is unmounted
    onCleanup(() => {
        stopCamera();
        disconnectWebSocket();
    });

    const captureAndSend = () => {
        const video = videoRef();
        const socket = ws();
        if (
            !video ||
            !socket ||
            !isConnected() ||
            !isCameraActive() ||
            !isAuthorized() ||
            !isSessionActive()
        ) {
            showToast({
                variant: "destructive",
                title: "Error",
                description: "You are not authorized to send images",
            });
            return;
        }

        // Create canvas to capture frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    socket.send(blob);
                    showToast({
                        title: "Photo Sent",
                        description: "Photo has been sent successfully",
                    });
                }
            },
            "image/jpeg",
            0.95,
        );
    };

    return (
        <Dialog open={props.isOpen} onOpenChange={props.onClose}>
            <DialogContent class="max-w-[90vw] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Take Attendance</DialogTitle>
                </DialogHeader>
                <div class="flex flex-col items-center gap-4">
                    <video
                        ref={setVideoRef}
                        autoplay
                        playsinline
                        muted
                        class="w-full max-w-[640px] rounded-lg bg-black"
                    />
                    {!isSessionActive() ? (
                        <Button
                            onClick={startSession}
                            disabled={!isConnected() || !isCameraActive() || !isAuthorized()}
                            class="w-full max-w-[200px]"
                        >
                            Start Session
                        </Button>
                    ) : (
                        <div class="flex flex-col items-center gap-2">
                            <Button
                                onClick={captureAndSend}
                                disabled={
                                    !isConnected() || !isCameraActive() || !isAuthorized()
                                }
                                class="w-full max-w-[200px]"
                            >
                                Capture and Send
                            </Button>
                            <p class="text-sm text-gray-500">
                                {sessionStats().presentCount}/{sessionStats().totalStudents}{" "}
                                present
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
