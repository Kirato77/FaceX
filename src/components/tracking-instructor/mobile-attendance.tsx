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
}

export function MobileAttendance(props: MobileAttendanceProps) {
    const [videoRef, setVideoRef] = createSignal<HTMLVideoElement | null>(null);
    const [stream, setStream] = createSignal<MediaStream | null>(null);
    const [ws, setWs] = createSignal<WebSocket | null>(null);
    const [isConnected, setIsConnected] = createSignal(false);
    const [isCameraActive, setIsCameraActive] = createSignal(false);
    const [isAuthorized, setIsAuthorized] = createSignal(false);
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
                        title: "Erreur",
                        description: `Impossible de démarrer la vidéo: ${error.message}`,
                    });
                });
            }
            setIsCameraActive(true);
        } catch (error) {
            showToast({
                variant: "destructive",
                title: "Erreur",
                description: `Impossible d'accéder à la caméra: ${(error as Error).message}`,
            });
        }
    };

    const connectWebSocket = async () => {
        try {
            // Vérifier si l'utilisateur est connecté et a le rôle d'instructeur
            if (!userContext.user() || userContext.user()?.role !== "instructor") {
                showToast({
                    variant: "destructive",
                    title: "Accès refusé",
                    description: "Seuls les professeurs peuvent utiliser cette fonctionnalité",
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
                    title: "Erreur d'authentification",
                    description: "Vous devez être connecté pour utiliser cette fonctionnalité",
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
                    title: "Erreur de connexion",
                    description: "Impossible de se connecter au serveur. Vérifiez que le serveur est en cours d'exécution.",
                });
            };

            // Gestionnaire d'événements pour la fermeture de connexion
            socket.onclose = (event) => {
                console.log("WebSocket connection closed:", event.code, event.reason);
                setIsConnected(false);
                setIsAuthorized(false);

                let errorMessage = "Connexion au serveur WebSocket perdue";
                if (event.code === 1015) {
                    errorMessage = "Erreur de connexion au serveur. Vérifiez que le serveur est correctement configuré.";
                }

                showToast({
                    variant: "destructive",
                    title: "Déconnexion",
                    description: errorMessage,
                });
            };

            // Gestionnaire d'événements pour l'ouverture de connexion
            socket.onopen = () => {
                console.log("WebSocket connection established");
                setIsConnected(true);
                setIsAuthorized(true);
                showToast({
                    title: "Connexion établie",
                    description: "Connexion au serveur WebSocket réussie",
                });
            };

            // Gestionnaire d'événements pour les messages
            socket.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    console.log("Received message from server:", response);
                    if (response.status === "error") {
                        showToast({
                            variant: "destructive",
                            title: "Erreur",
                            description: response.message,
                        });
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
                title: "Erreur",
                description: `Impossible d'établir une connexion sécurisée: ${(error as Error).message}`,
            });
        }
    };

    const disconnectWebSocket = () => {
        const socket = ws();
        if (socket) {
            socket.close();
            setWs(null);
        }
    };

    // Handle camera and WebSocket when dialog opens/closes
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
            !isAuthorized()
        ) {
            showToast({
                variant: "destructive",
                title: "Erreur",
                description: "Vous n'êtes pas autorisé à envoyer des images",
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
                        title: "Photo envoyée",
                        description: "La photo a été envoyée avec succès",
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
                    <DialogTitle>Prise de présences</DialogTitle>
                </DialogHeader>
                <div class="flex flex-col items-center gap-4">
                    <video
                        ref={setVideoRef}
                        autoplay
                        playsinline
                        muted
                        class="w-full max-w-[640px] rounded-lg bg-black"
                    />
                    <Button
                        onClick={captureAndSend}
                        disabled={!isConnected() || !isCameraActive() || !isAuthorized()}
                        class="w-full max-w-[200px]"
                    >
                        Capturer et envoyer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
