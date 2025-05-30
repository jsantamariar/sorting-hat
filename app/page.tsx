"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Text,
  Html,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Hook personalizado para detectar móvil sin problemas de hidratación
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Definir el tipo personalizado para el canvas con __r3f
interface CustomCanvas extends HTMLCanvasElement {
  __r3f?: {
    camera: THREE.Camera;
  };
}

const houses = {
  gryffindor: { name: "Gryffindor", color: "#DC143C", accent: "#FFD700" },
  hufflepuff: { name: "Hufflepuff", color: "#FFD700", accent: "#000000" },
  ravenclaw: { name: "Ravenclaw", color: "#0052CC", accent: "#C0C0C0" },
  slytherin: { name: "Slytherin", color: "#228B22", accent: "#C0C0C0" },
};

const questions = [
  {
    question: "¿Cuál es tu cualidad más valorada?",
    answers: [
      { text: "Valentía", house: "gryffindor" },
      { text: "Lealtad", house: "hufflepuff" },
      { text: "Inteligencia", house: "ravenclaw" },
      { text: "Ambición", house: "slytherin" },
    ],
  },
  {
    question: "¿Qué prefieres hacer en tu tiempo libre?",
    answers: [
      { text: "Aventuras emocionantes", house: "gryffindor" },
      { text: "Ayudar a otros", house: "hufflepuff" },
      { text: "Leer y estudiar", house: "ravenclaw" },
      { text: "Planear mi futuro", house: "slytherin" },
    ],
  },
  {
    question: "¿Cuál es tu mayor miedo?",
    answers: [
      { text: "Ser cobarde", house: "gryffindor" },
      { text: "Estar solo", house: "hufflepuff" },
      { text: "La ignorancia", house: "ravenclaw" },
      { text: "El fracaso", house: "slytherin" },
    ],
  },
  {
    question: "¿Qué animal te representa mejor?",
    answers: [
      { text: "León", house: "gryffindor" },
      { text: "Tejón", house: "hufflepuff" },
      { text: "Águila", house: "ravenclaw" },
      { text: "Serpiente", house: "slytherin" },
    ],
  },
  {
    question: "¿Cómo prefieres enfrentar un conflicto?",
    answers: [
      { text: "De frente y con decisión", house: "gryffindor" },
      { text: "Buscando la paz y comprensión", house: "hufflepuff" },
      { text: "Analizando todas las opciones", house: "ravenclaw" },
      { text: "Estratégicamente y con astucia", house: "slytherin" },
    ],
  },
  {
    question: "¿Qué elemento mágico te atrae más?",
    answers: [
      { text: "El fuego ardiente", house: "gryffindor" },
      { text: "La tierra fértil", house: "hufflepuff" },
      { text: "El aire y las alturas", house: "ravenclaw" },
      { text: "El agua profunda", house: "slytherin" },
    ],
  },
  {
    question: "¿Qué buscas en una amistad?",
    answers: [
      { text: "Compañeros de aventura", house: "gryffindor" },
      { text: "Apoyo incondicional", house: "hufflepuff" },
      { text: "Conversaciones profundas", house: "ravenclaw" },
      { text: "Aliados ambiciosos", house: "slytherin" },
    ],
  },
];

export default function SortingHatApp() {
  const [gameState, setGameState] = useState<"start" | "sorting" | "result">(
    "start"
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<
    keyof typeof houses | null
  >(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLumosActive, setIsLumosActive] = useState(false);
  const [showLumosDialog, setShowLumosDialog] = useState(false);
  const [particles, setParticles] = useState<
    Array<{
      left: string;
      top: string;
      animationDelay: string;
      animationDuration: string;
    }>
  >([]);

  // Hook para detectar móvil
  const isMobile = useIsMobile();

  // Referencias globales para la detección de clics
  const hatRef = useRef<THREE.Group>(null!);
  const titleRef = useRef<THREE.Group>(null!);

  // Referencias para las funciones de activación
  const activateHatMagicRef = useRef<(() => void) | null>(null);
  const activateTitleAnimationRef = useRef<(() => void) | null>(null);

  // Generar partículas solo en el cliente para evitar hidratación mismatch
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 4}s`,
        animationDuration: `${3 + Math.random() * 3}s`,
      });
    }
    setParticles(newParticles);
  }, []);

  const startSorting = () => {
    setGameState("sorting");
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedHouse(null);
  };

  const answerQuestion = (house: string) => {
    const newAnswers = [...answers, house];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calcular casa basada en respuestas
      setIsThinking(true);
      setTimeout(() => {
        const houseCounts = newAnswers.reduce((acc, house) => {
          acc[house] = (acc[house] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedHouse = Object.keys(houseCounts).reduce((a, b) =>
          houseCounts[a] > houseCounts[b] ? a : b
        ) as keyof typeof houses;

        setSelectedHouse(sortedHouse);
        setIsThinking(false);
        setGameState("result");
      }, 4000);
    }
  };

  const resetGame = () => {
    setGameState("start");
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedHouse(null);
    setIsThinking(false);
  };

  // Función para activar el hechizo Lumos - solo en desktop
  const activateLumos = () => {
    // Solo activar Lumos en desktop (no móvil)
    if (isMobile) {
      console.log("🚫 Lumos no disponible en móvil");
      return;
    }

    // Si Lumos ya está activo, no hacer nada
    if (isLumosActive) {
      console.log("⚡ Lumos ya está activo, ignorando nueva activación");
      return;
    }

    console.log("✨ LUMOS! Iluminando el fondo");
    setShowLumosDialog(true);
    setIsLumosActive(true);

    // Ocultar el diálogo después de 2 segundos
    setTimeout(() => {
      setShowLumosDialog(false);
    }, 2000);

    // Desactivar Lumos después de 8 segundos
    setTimeout(() => {
      setIsLumosActive(false);
    }, 8000);
  };

  // Componente Loader
  function Loader() {
    const { progress } = useProgress();
    const [loaderParticles, setLoaderParticles] = useState<
      Array<{
        left: string;
        top: string;
        animationDelay: string;
        animationDuration: string;
      }>
    >([]);

    useEffect(() => {
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        });
      }
      setLoaderParticles(newParticles);
    }, []);

    useEffect(() => {
      if (progress === 100) {
        // Pequeño delay para suavizar la transición
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }, [progress]);

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-slate-900 to-black flex items-center justify-center z-50">
        <div className="text-center">
          {/* Partículas mágicas del loader */}
          <div className="absolute inset-0 pointer-events-none">
            {loaderParticles.map((particle, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-amber-400 rounded-full animate-pulse opacity-60"
                style={{
                  left: particle.left,
                  top: particle.top,
                  animationDelay: particle.animationDelay,
                  animationDuration: particle.animationDuration,
                }}
              />
            ))}
          </div>

          {/* Sombrero animado como loader */}

          {/* Barra de progreso */}
          <div className="w-80 bg-gray-700 rounded-full h-3 mb-4 mx-auto">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Porcentaje */}
          <p className="text-lg mb-4 text-white">
            Cargando magia... {Math.round(progress)}%
          </p>

          {/* Texto de carga */}
          <div className="text-sm text-white">
            {progress < 30 && "Preparando el Gran Salón..."}
            {progress >= 30 &&
              progress < 60 &&
              "Despertando al Sombrero Seleccionador..."}
            {progress >= 60 &&
              progress < 90 &&
              "Cargando la Varita de Saúco..."}
            {progress >= 90 && "¡Casi listo para la selección!"}
          </div>
        </div>
      </div>
    );
  }

  // Componente para el diálogo de Lumos
  function LumosDialog({ isMobile }: { isMobile: boolean }) {
    return (
      <div
        className={`fixed z-40 pointer-events-none ${
          isMobile
            ? "top-2 left-1/2 transform -translate-x-1/2"
            : "top-4 right-4"
        }`}
        style={{
          animation: "slideInFromRight 0.4s ease-out",
        }}
      >
        <div
          className={`relative bg-gradient-to-br from-blue-900/95 to-cyan-900/95 border-3 border-cyan-300 rounded-2xl backdrop-blur-lg shadow-2xl border-opacity-80 ${
            isMobile ? "p-3 max-w-xs" : "p-6 max-w-sm"
          }`}
          style={{
            animation: "bounceIn 0.5s ease-out",
          }}
        >
          <div className="text-center relative">
            {/* Efecto de resplandor detrás del diálogo */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-2xl blur-md scale-105 animate-pulse"></div>

            <div className="relative z-10">
              <div
                className={`mb-1 ${isMobile ? "text-2xl" : "text-4xl"}`}
                style={{
                  animation: "flash 1s ease-in-out infinite",
                }}
              >
                ⚡✨
              </div>
              <h2
                className={`font-bold text-cyan-100 font-serif animate-pulse drop-shadow-lg ${
                  isMobile ? "text-lg mb-1" : "text-2xl mb-2"
                }`}
              >
                ¡LUMOS!
              </h2>
              <p
                className={`text-cyan-200 drop-shadow-md leading-tight ${
                  isMobile ? "text-xs" : "text-sm"
                }`}
              >
                La Varita de Saúco ilumina las tinieblas
              </p>
            </div>

            {/* Efectos de partículas del diálogo más compactos */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(isMobile ? 8 : 15)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute bg-cyan-300 rounded-full animate-ping ${
                    isMobile ? "w-1 h-1" : "w-1.5 h-1.5"
                  }`}
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    top: `${15 + Math.random() * 70}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${0.8 + Math.random() * 0.7}s`,
                  }}
                />
              ))}
            </div>

            {/* Rayos de luz compactos */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {[...Array(isMobile ? 4 : 6)].map((_, i) => (
                <div
                  key={`ray-${i}`}
                  className="absolute bg-gradient-to-r from-transparent via-cyan-300 to-transparent h-0.5 opacity-40 animate-ping"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: isMobile ? "40px" : "80px",
                    transform: `translate(-50%, -50%) rotate(${
                      i * (isMobile ? 90 : 60)
                    }deg)`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Definir animaciones CSS */}
        <style jsx>{`
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes bounceIn {
            from {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes flash {
            0%,
            100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(1.1);
            }
          }
        `}</style>
      </div>
    );
  }

  // Componente para el manejo global de clics
  function GlobalClickHandler({
    hatRef,
    titleRef,
    activateLumos,
    activateHatMagicRef,
    activateTitleAnimationRef,
    isMobile,
  }: {
    hatRef: React.RefObject<THREE.Group>;
    titleRef: React.RefObject<THREE.Group>;
    activateLumos: () => void;
    activateHatMagicRef: React.RefObject<(() => void) | null>;
    activateTitleAnimationRef: React.RefObject<(() => void) | null>;
    isMobile: boolean;
  }) {
    const { camera } = useThree();
    const [raycaster] = useState(() => new THREE.Raycaster());
    const [pointer] = useState(() => new THREE.Vector2());

    useEffect(() => {
      const handleClick = (event: MouseEvent) => {
        // Verificar si el clic ocurrió en algún elemento de la interfaz HTML
        const target = event.target as HTMLElement;

        // Si el clic fue en un botón, input u otro elemento de interfaz, no activar Lumos
        if (
          target.closest("button") ||
          target.closest(".bg-black\\/85") || // Cualquier elemento con la clase de las cards
          target.closest('[role="button"]') ||
          target.closest("input") ||
          target.closest("select") ||
          target.closest("textarea")
        ) {
          console.log("Clic en interfaz HTML, no activar Lumos");
          return;
        }

        // Convertir coordenadas del mouse a coordenadas normalizadas (-1 a +1)
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Actualizar el raycaster con la posición del mouse y la cámara
        if (camera) {
          raycaster.setFromCamera(pointer, camera);

          // Variable para rastrear si se clicó en algún objeto específico
          let clickedOnSpecificObject = false;

          // Comprobar si el rayo intersecta con el sombrero
          if (hatRef.current) {
            const hatIntersects = raycaster.intersectObject(
              hatRef.current,
              true
            );
            if (hatIntersects.length > 0) {
              console.log("¡SOMBRERO CLICADO! Activando efectos mágicos");
              activateHatMagicRef.current?.();
              clickedOnSpecificObject = true;
            }
          }

          // Comprobar si el rayo intersecta con el título
          if (titleRef.current && !clickedOnSpecificObject) {
            const titleIntersects = raycaster.intersectObject(
              titleRef.current,
              true
            );
            if (titleIntersects.length > 0) {
              console.log("¡TÍTULO CLICADO! Activando animación mágica");
              activateTitleAnimationRef.current?.();
              clickedOnSpecificObject = true;
            }
          }

          // Si no se clicó en ningún objeto específico, comportamiento diferente según dispositivo
          if (!clickedOnSpecificObject) {
            if (isMobile) {
              console.log(
                "📱 Clic en móvil - Lumos no disponible en este dispositivo"
              );
            } else {
              console.log("¡CLIC EN EL FONDO! Activando Lumos");
              activateLumos();
            }
          }
        }
      };

      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }, [
      raycaster,
      pointer,
      camera,
      hatRef,
      titleRef,
      activateLumos,
      activateHatMagicRef,
      activateTitleAnimationRef,
    ]);

    return null; // Este componente no renderiza nada visible
  }

  return (
    <div
      className="w-full h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black relative overflow-hidden"
      style={{ cursor: "none" }}
    >
      {/* Partículas mágicas flotantes */}
      <div className="absolute inset-0 opacity-20">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400 rounded-full animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration,
            }}
          />
        ))}
      </div>

      <Canvas
        camera={{ position: [0, 2, 22], fov: isMobile ? 75 : 50 }}
        shadows
        style={{ cursor: "none" }}
      >
        <Environment preset="night" />

        {/* Niebla atmosférica que cambia según la casa */}
        <fog
          attach="fog"
          args={[
            isLumosActive
              ? "#4A90E2" // Azul brillante cuando Lumos está activo
              : selectedHouse
              ? selectedHouse === "gryffindor"
                ? "#2B0000"
                : selectedHouse === "hufflepuff"
                ? "#3D2914"
                : selectedHouse === "ravenclaw"
                ? "#0A0A2E"
                : selectedHouse === "slytherin"
                ? "#0D1A0D"
                : "#1a1a2e"
              : isThinking
              ? "#1A0A2E"
              : "#1a1a2e",
            isLumosActive ? 15 : 10, // Niebla más lejana cuando Lumos está activo
            isLumosActive ? 35 : 30,
          ]}
        />

        {/* Iluminación principal - atmosfera oscura pero visible */}
        <ambientLight
          intensity={isLumosActive ? 1.5 : 0.5}
          color={isLumosActive ? "#87CEEB" : "#1a1a2e"}
        />

        {/* Luz principal del sombrero - más intensa */}
        <directionalLight
          position={[-8, 8, 8]}
          intensity={isLumosActive ? 8 : 3}
          color={isLumosActive ? "#87CEEB" : "#ffd700"}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Spotlight dramático para el sombrero - más potente */}
        <spotLight
          position={[-12, 12, 10]}
          angle={0.4}
          penumbra={0.6}
          intensity={isLumosActive ? 6 : 4}
          color={isLumosActive ? "#87CEEB" : "#ffd700"}
          target-position={isMobile ? [0, 1, 0] : [-8, -3, 0]}
          castShadow
        />

        {/* Luz adicional para el sombrero desde abajo */}
        <pointLight
          position={isMobile ? [0, -2, 3] : [-8, -6, 3]}
          intensity={isLumosActive ? 3 : 1.5}
          color={isLumosActive ? "#ADD8E6" : "#ffaa00"}
        />

        {/* Luz de relleno para el sombrero */}
        <pointLight
          position={isMobile ? [-2, 2, 5] : [-12, -1, 5]}
          intensity={isLumosActive ? 4 : 2}
          color={isLumosActive ? "#87CEEB" : "#ffffff"}
        />

        {/* Luz para la interfaz derecha */}
        <pointLight
          position={isMobile ? [0, -10, 5] : [5, 3, 5]}
          intensity={isLumosActive ? 2.5 : 1.2}
          color={isLumosActive ? "#ADD8E6" : "#ffffff"}
        />

        {/* Luces ambientales suaves */}
        <spotLight
          position={[8, 8, 8]}
          angle={0.5}
          penumbra={1}
          intensity={isLumosActive ? 1.5 : 0.6}
          color={isLumosActive ? "#B0E0E6" : "#e67e22"}
          target-position={isMobile ? [0, -8, 0] : [5, 0, 0]}
        />

        {/* Luces adicionales de Lumos - solo cuando está activo */}
        {isLumosActive && (
          <>
            <pointLight position={[0, 10, 0]} intensity={3} color="#87CEEB" />
            <pointLight position={[0, -5, 0]} intensity={2} color="#ADD8E6" />
            <pointLight position={[10, 0, 0]} intensity={2} color="#B0E0E6" />
            <pointLight position={[-10, 0, 0]} intensity={2} color="#B0E0E6" />
            <pointLight position={[0, 0, 10]} intensity={2} color="#AFEEEE" />
            <pointLight position={[0, 0, -10]} intensity={2} color="#AFEEEE" />

            {/* Luz ambiental intensa de Lumos */}
            <ambientLight intensity={0.8} color="#E0F6FF" />

            {/* Luces adicionales para el efecto de iluminación global */}
            <directionalLight
              position={[5, 5, 5]}
              intensity={2}
              color="#87CEEB"
            />
            <directionalLight
              position={[-5, 5, -5]}
              intensity={2}
              color="#ADD8E6"
            />

            {/* Spotlight circular que ilumina toda la escena */}
            <spotLight
              position={[0, 15, 0]}
              angle={Math.PI / 2}
              penumbra={0.3}
              intensity={4}
              color="#B0E0E6"
              target-position={[0, 0, 0]}
            />
          </>
        )}

        {/* Título flotante con fuente de Harry Potter */}
        <FloatingTitle
          titleRef={titleRef}
          activateTitleAnimationRef={activateTitleAnimationRef}
          isMobile={isMobile}
        />

        {/* Sombrero Seleccionador 3D - Posicionado más centrado y arriba */}
        <SortingHat
          hatRef={hatRef}
          isThinking={isThinking}
          selectedHouse={selectedHouse}
          gameState={gameState}
          activateHatMagicRef={activateHatMagicRef}
          isMobile={isMobile}
        />

        {/* Efectos de partículas mágicas */}
        {(isThinking || selectedHouse) && (
          <MagicalParticles
            selectedHouse={selectedHouse}
            isThinking={isThinking}
            isMobile={isMobile}
          />
        )}

        {/* Partículas de niebla atmosférica */}
        <AtmosphericFog
          selectedHouse={selectedHouse}
          isThinking={isThinking}
          isLumosActive={isLumosActive}
        />

        {/* Componente global para manejo de clics */}
        <GlobalClickHandler
          hatRef={hatRef}
          titleRef={titleRef}
          activateLumos={activateLumos}
          activateHatMagicRef={activateHatMagicRef}
          activateTitleAnimationRef={activateTitleAnimationRef}
          isMobile={isMobile}
        />

        {/* Cursor de varita mágica - Renderizado antes de la interfaz HTML */}
        <MagicalWandCursor />

        {/* Interfaz HTML superpuesta - Posicionada responsivamente */}
        <Html position={isMobile ? [0, -8, -5] : [5, 0, -10]} center>
          <div
            className={`text-center ${
              isMobile ? "w-80 max-w-sm px-4" : "w-96"
            }`}
            style={{ cursor: "default" }}
          >
            {gameState === "start" && (
              <Card className="bg-black/85 border-amber-600 backdrop-blur-md shadow-2xl border-2">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-amber-400 mb-3 sm:mb-4">
                    ¡Bienvenido a Hogwarts!
                  </h2>
                  <p className="text-gray-200 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                    El Sombrero Seleccionador determinará a qué casa perteneces.
                    Responde honestamente a las preguntas y descubre tu destino
                    mágico.
                  </p>
                  <Button
                    onClick={startSorting}
                    className="bg-amber-600 hover:bg-amber-700 text-black font-bold px-6 sm:px-8 py-2 sm:py-3 shadow-lg text-sm sm:text-base"
                    style={{ cursor: "default" }}
                  >
                    🎩 Comenzar Selección
                  </Button>
                </CardContent>
              </Card>
            )}

            {gameState === "sorting" && !isThinking && (
              <Card className="bg-black/85 border-amber-600 backdrop-blur-md shadow-2xl border-2">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-3 sm:mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-amber-400 font-semibold text-sm sm:text-base">
                        Progreso
                      </span>
                      <span className="text-amber-400 font-semibold text-sm sm:text-base">
                        {currentQuestion + 1}/{questions.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            ((currentQuestion + 1) / questions.length) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-amber-400 mb-3 sm:mb-4">
                    {questions[currentQuestion].question}
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {questions[currentQuestion].answers.map((answer, index) => (
                      <Button
                        key={index}
                        onClick={() => answerQuestion(answer.house)}
                        variant="outline"
                        className="w-full bg-gray-800/60 border-gray-600 text-gray-200 hover:bg-gray-700/80 hover:border-amber-500 transition-all duration-300 p-3 sm:p-4 text-left text-sm sm:text-base"
                        style={{ cursor: "default" }}
                      >
                        {answer.text}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {isThinking && (
              <Card className="bg-black/85 border-amber-600 backdrop-blur-md shadow-2xl border-2">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-amber-400 mb-3 sm:mb-4">
                    🎩 El sombrero está deliberando...
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-gray-200 text-base sm:text-lg">
                    <p className="animate-pulse">"Hmm... muy interesante..."</p>
                    <p
                      className="animate-pulse"
                      style={{ animationDelay: "1s" }}
                    >
                      "Veo coraje... pero también sabiduría..."
                    </p>
                    <p
                      className="animate-pulse"
                      style={{ animationDelay: "2s" }}
                    >
                      "Sí... ya lo tengo..."
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-6 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-amber-400"></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {gameState === "result" && selectedHouse && (
              <Card
                className="bg-black/85 backdrop-blur-md border-4 shadow-2xl"
                style={{ borderColor: houses[selectedHouse].color }}
              >
                <CardContent className="p-6 sm:p-8">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">
                    {selectedHouse === "gryffindor" && "🦁"}
                    {selectedHouse === "hufflepuff" && "🦡"}
                    {selectedHouse === "ravenclaw" && "🦅"}
                    {selectedHouse === "slytherin" && "🐍"}
                  </div>
                  <h2
                    className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4"
                    style={{
                      color:
                        selectedHouse === "hufflepuff"
                          ? "#FFFFFF"
                          : houses[selectedHouse].accent,
                    }}
                  >
                    ¡{houses[selectedHouse].name.toUpperCase()}!
                  </h2>
                  <p
                    className={`mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed ${
                      selectedHouse === "hufflepuff"
                        ? "text-white"
                        : "text-gray-200"
                    }`}
                  >
                    El Sombrero Seleccionador ha hablado. Tu lugar está en la
                    noble casa de{" "}
                    <span
                      className="font-bold text-lg sm:text-2xl"
                      style={{
                        color:
                          selectedHouse === "hufflepuff"
                            ? "#FFFFFF"
                            : houses[selectedHouse].accent,
                      }}
                    >
                      {houses[selectedHouse].name}
                    </span>
                    . ¡Que comience tu aventura mágica!
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={resetGame}
                      className="bg-amber-600 hover:bg-amber-700 text-black font-bold px-6 sm:px-8 py-2 sm:py-3 w-full text-sm sm:text-base"
                      style={{ cursor: "none" }}
                    >
                      🔄 Intentar de Nuevo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Html>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          minDistance={10}
          maxDistance={20}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Mostrar el componente Loader si isLoading es true */}
      {isLoading && <Loader />}

      {/* Mostrar el componente LumosDialog si showLumosDialog es true y no es móvil */}
      {showLumosDialog && !isMobile && <LumosDialog isMobile={isMobile} />}

      {/* Créditos del desarrollador */}
      <div className="fixed bottom-4 left-4 z-30">
        <a
          href="https://www.linkedin.com/in/santamariaramosj/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 text-xs hover:text-gray-300 transition-colors duration-300 cursor-pointer opacity-70 hover:opacity-100"
        >
          Created with ❤️ by Jorge Santamaria
        </a>
      </div>
    </div>
  );
}

// Componente para el cursor de varita mágica
function MagicalWandCursor() {
  const wandRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF("/models/elder_wand.glb");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Convertir coordenadas del mouse a coordenadas 3D
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x, y });
    };

    const handleMouseDown = () => {
      setIsClicking(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useFrame((state) => {
    if (wandRef.current) {
      // Convertir posición del mouse a coordenadas 3D del mundo usando el mismo método que el raycaster
      const vector = new THREE.Vector3(mousePosition.x, mousePosition.y, 0.5);
      vector.unproject(state.camera);

      const dir = vector.sub(state.camera.position).normalize();
      const distance = 15; // Distancia fija desde la cámara
      const pos = state.camera.position
        .clone()
        .add(dir.multiplyScalar(distance));

      // Posicionar la varita exactamente donde el raycaster detectaría el clic
      wandRef.current.position.copy(pos);

      // Ajustar la posición para que la punta de la varita esté en el puntero
      // Considerando la rotación de 30 grados y el tamaño de la varita
      const offsetX = -0.8; // Offset horizontal para compensar la rotación
      const offsetY = -0.5; // Offset vertical para que la punta esté en el puntero

      wandRef.current.position.x += offsetX;
      wandRef.current.position.y += offsetY;

      // Log para debug - mostrar posición de la varita
      if (Math.random() < 0.01) {
        // Solo mostrar ocasionalmente para no saturar la consola
        console.log("Posición de la varita:", wandRef.current.position);
        console.log("Coordenadas del mouse normalizadas:", mousePosition);
      }

      wandRef.current.rotation.z = 30;
      // Efecto al hacer clic
      if (isClicking) {
        wandRef.current.scale.set(1.6, 1.6, 1.6); // Ligeramente más grande al hacer clic
      } else {
        wandRef.current.scale.set(1.5, 1.5, 1.5); // Tamaño normal
      }
    }
  });

  return (
    <group ref={wandRef} scale={[1.5, 1.5, 1.5]}>
      <primitive object={scene} className="z-10" />
    </group>
  );
}

function FloatingTitle({
  titleRef,
  activateTitleAnimationRef,
  isMobile,
}: {
  titleRef: React.RefObject<THREE.Group>;
  activateTitleAnimationRef: React.RefObject<(() => void) | null>;
  isMobile: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTitleParticles, setShowTitleParticles] = useState(false);

  // Función para activar la animación del título
  const activateTitleAnimation = () => {
    console.log("🌟 ACTIVANDO ANIMACIÓN DEL TÍTULO!");
    setIsAnimating(true);
    setShowTitleParticles(true);

    // Desactivar animación después de un tiempo
    setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setShowTitleParticles(false);
      }, 1000);
    }, 2000);
  };

  // Exponer la función de activación a la referencia del padre
  useEffect(() => {
    if (activateTitleAnimationRef) {
      activateTitleAnimationRef.current = activateTitleAnimation;
    }
  }, [activateTitleAnimationRef]);

  useFrame((state) => {
    if (titleRef.current) {
      // Efecto de flotación base
      const baseFloat = Math.sin(state.clock.elapsedTime * 0.8) * 0.3;

      // Posicionamiento responsivo - en móvil va arriba, en desktop mantiene posición original
      const baseY = isMobile ? 12 : 7.5; // Más arriba en móvil para mayor separación
      const baseX = isMobile ? 0 : 0; // Centrado en móvil

      if (isAnimating) {
        // Animación dramática cuando se hace clic
        titleRef.current.position.y =
          baseY + baseFloat + Math.sin(state.clock.elapsedTime * 8) * 0.8;
        titleRef.current.position.x =
          baseX + Math.sin(state.clock.elapsedTime * 6) * 0.5;
        titleRef.current.rotation.z =
          Math.sin(state.clock.elapsedTime * 10) * 0.15;
        titleRef.current.scale.set(
          1 + Math.sin(state.clock.elapsedTime * 12) * 0.2,
          1 + Math.sin(state.clock.elapsedTime * 12) * 0.2,
          1 + Math.sin(state.clock.elapsedTime * 12) * 0.2
        );
      } else {
        // Flotación suave normal
        titleRef.current.position.y = baseY + baseFloat;
        titleRef.current.position.x =
          baseX + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        titleRef.current.rotation.z =
          Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
        titleRef.current.scale.set(1, 1, 1);
      }
    }
  });

  // Tamaño de fuente responsivo - más pequeño en móvil para que quepa mejor
  const fontSize = isMobile ? 1.0 : 1.4;

  return (
    <group ref={titleRef}>
      {/* Área de detección invisible para el título */}
      <mesh position={[0, 0, 0]} visible={false}>
        <boxGeometry args={[8, 2, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <Text
        position={[0, 0, 0]}
        fontSize={fontSize}
        color={isAnimating ? "#ff6b35" : "#ffd700"}
        anchorX="center"
        anchorY="middle"
        font="/fonts/HARRYP__.TTF"
      >
        El Sombrero Seleccionador
      </Text>

      {/* Resplandor detrás del título */}
      <mesh position={[0, 0, -0.1]} scale={[8, 2, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={isAnimating ? "#ff6b35" : "#ffd700"}
          transparent
          opacity={isAnimating ? 0.3 : 0.1}
          emissive={isAnimating ? "#ff6b35" : "#ffd700"}
          emissiveIntensity={isAnimating ? 0.5 : 0.2}
        />
      </mesh>

      {/* Partículas mágicas del título */}
      {showTitleParticles && <TitleMagicParticles />}
    </group>
  );
}

function SortingHat({
  isThinking,
  selectedHouse,
  gameState,
  hatRef,
  activateHatMagicRef,
  isMobile,
}: {
  isThinking: boolean;
  selectedHouse: keyof typeof houses | null;
  gameState: string;
  hatRef: React.RefObject<THREE.Group>;
  activateHatMagicRef: React.RefObject<(() => void) | null>;
  isMobile: boolean;
}) {
  const { scene } = useGLTF("/models/sorting_hat_fan_art.glb");
  const [isSpinning, setIsSpinning] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [showMagicParticles, setShowMagicParticles] = useState(false);

  // Función para activar el efecto mágico
  const activateMagicEffect = () => {
    console.log("🪄 ACTIVANDO EFECTOS MÁGICOS!");
    // Activar giro
    setIsSpinning(true);
    console.log("✅ Spinning activado");
    // Activar brillo
    setIsGlowing(true);
    console.log("✅ Glow activado");
    // Activar partículas
    setShowMagicParticles(true);
    console.log("✅ Magic particles activadas");

    // Desactivar efectos después de un tiempo
    setTimeout(() => {
      console.log("⏰ Desactivando efectos después de 1.5s");
      setIsSpinning(false);
      setIsGlowing(false);
      setTimeout(() => {
        setShowMagicParticles(false);
        console.log("✅ Todos los efectos desactivados");
      }, 1000); // Las partículas duran un poco más
    }, 1500);
  };

  // Exponer la función de activación a la referencia del padre
  useEffect(() => {
    if (activateHatMagicRef) {
      activateHatMagicRef.current = activateMagicEffect;
    }
  }, [activateHatMagicRef]);

  useFrame((state, delta) => {
    if (hatRef.current) {
      // Efecto de flotación base
      const baseFloat = Math.sin(state.clock.elapsedTime * 1.2) * 0.4;

      // Posicionamiento responsivo - en móvil centrado verticalmente entre título y preguntas
      const baseX = isMobile ? 0 : -8; // Centrado en móvil, a la izquierda en desktop
      const baseY = isMobile ? 3 : -3; // Más centrado en móvil con mayor separación

      // Efecto de giro rápido cuando se activa
      if (isSpinning) {
        hatRef.current.rotation.y += delta * 15; // Giro rápido en Y
        hatRef.current.rotation.x =
          Math.sin(state.clock.elapsedTime * 10) * 0.2; // Bamboleo en X
      } else if (isThinking) {
        // Animación de "pensamiento" más dramática
        hatRef.current.rotation.z =
          Math.sin(state.clock.elapsedTime * 2) * 0.15;
        hatRef.current.position.y =
          baseY + baseFloat + Math.sin(state.clock.elapsedTime * 3) * 0.3;
        hatRef.current.position.x =
          baseX + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      } else if (gameState === "result" && selectedHouse) {
        // Animación de celebración
        hatRef.current.position.y =
          baseY + baseFloat + Math.sin(state.clock.elapsedTime * 4) * 0.5;
        hatRef.current.rotation.z =
          Math.sin(state.clock.elapsedTime * 2.5) * 0.1;
        hatRef.current.position.x = baseX;
      } else {
        // Flotación suave en reposo
        hatRef.current.position.y = baseY + baseFloat;
        hatRef.current.position.x =
          baseX + Math.sin(state.clock.elapsedTime * 0.7) * 0.1;
        hatRef.current.rotation.z =
          Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
      }
    }

    // Aplicar efecto de brillo al sombrero
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              // Aumentar la emisividad cuando está brillando
              if (isGlowing) {
                material.emissiveIntensity =
                  0.8 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
              } else if (selectedHouse) {
                material.emissiveIntensity = 0.15;
              } else {
                material.emissiveIntensity = 0.05;
              }
            }
          });
        }
      });
    }
  });

  useEffect(() => {
    if (scene && selectedHouse) {
      // Cambiar color del sombrero según la casa seleccionada
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.color.setHex(
                Number.parseInt(houses[selectedHouse].color.replace("#", "0x"))
              );
              material.emissive.setHex(
                Number.parseInt(houses[selectedHouse].accent.replace("#", "0x"))
              );
              material.emissiveIntensity = 0.15;
            }
          });
        }
      });
    }
  }, [scene, selectedHouse]);

  return (
    <group ref={hatRef} position={[-8, -3, 0]} scale={[20, 20, 20]}>
      <primitive object={scene} />

      {/* Área de detección invisible más grande para capturar clics en todo el sombrero */}
      <mesh position={[0, 0, 0]} visible={false}>
        <boxGeometry args={[2, 3, 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Sombra flotante debajo del sombrero */}
      <mesh
        position={[0, -2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.5, 1.5, 1]}
      >
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.3}
          emissive="#000000"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Partículas mágicas que salen al hacer clic */}
      {showMagicParticles && <HatMagicParticles />}
    </group>
  );
}

// Componente para las partículas mágicas que salen del sombrero al hacer clic
function HatMagicParticles() {
  const particlesRef = useRef<THREE.Group>(null!);
  const particleCount = 50;
  const [particles, setParticles] = useState<
    Array<{
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      scale: number;
      color: string;
    }>
  >([]);

  // Inicializar partículas
  useEffect(() => {
    const newParticles = [];
    const colors = ["#ffd700", "#ff9900", "#ffcc00", "#ff6600", "#ffff00"];

    for (let i = 0; i < particleCount; i++) {
      // Posición inicial aleatoria cerca del centro del sombrero
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;

      newParticles.push({
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.random() * 0.5,
          Math.sin(angle) * radius
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.15,
          (Math.random() - 0.5) * 0.1
        ),
        scale: 0.02 + Math.random() * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setParticles(newParticles);
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      // Actualizar posición de cada partícula
      particlesRef.current.children.forEach((particle, i) => {
        if (i < particles.length) {
          // Actualizar posición basada en velocidad
          particles[i].position.x += particles[i].velocity.x;
          particles[i].position.y += particles[i].velocity.y;
          particles[i].position.z += particles[i].velocity.z;

          // Aplicar gravedad y resistencia del aire
          particles[i].velocity.y -= 0.005;
          particles[i].velocity.x *= 0.99;
          particles[i].velocity.z *= 0.99;

          // Actualizar la posición de la partícula en la escena
          particle.position.copy(particles[i].position);

          // Reducir escala gradualmente para efecto de desvanecimiento
          const scale = particle.scale.x - 0.001;
          if (scale > 0) {
            particle.scale.set(scale, scale, scale);
          }
        }
      });
    }
  });

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh
          key={i}
          position={particle.position}
          scale={[particle.scale, particle.scale, particle.scale]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// Componente para las partículas mágicas del título
function TitleMagicParticles() {
  const particlesRef = useRef<THREE.Group>(null!);
  const particleCount = 40;
  const [particles, setParticles] = useState<
    Array<{
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      scale: number;
      color: string;
    }>
  >([]);

  // Inicializar partículas
  useEffect(() => {
    const newParticles = [];
    const colors = ["#ff6b35", "#ffd700", "#ff9500", "#ffaa00", "#ff4500"];

    for (let i = 0; i < particleCount; i++) {
      // Posición inicial aleatoria alrededor del título
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2;

      newParticles.push({
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.random() * 1 - 0.5,
          Math.sin(angle) * radius
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          Math.random() * 0.2,
          (Math.random() - 0.5) * 0.15
        ),
        scale: 0.03 + Math.random() * 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setParticles(newParticles);
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      // Actualizar posición de cada partícula
      particlesRef.current.children.forEach((particle, i) => {
        if (i < particles.length) {
          // Actualizar posición basada en velocidad
          particles[i].position.x += particles[i].velocity.x;
          particles[i].position.y += particles[i].velocity.y;
          particles[i].position.z += particles[i].velocity.z;

          // Aplicar gravedad y resistencia del aire
          particles[i].velocity.y -= 0.003;
          particles[i].velocity.x *= 0.98;
          particles[i].velocity.z *= 0.98;

          // Actualizar la posición de la partícula en la escena
          particle.position.copy(particles[i].position);

          // Reducir escala gradualmente para efecto de desvanecimiento
          const scale = particle.scale.x - 0.0008;
          if (scale > 0) {
            particle.scale.set(scale, scale, scale);
          }
        }
      });
    }
  });

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh
          key={i}
          position={particle.position}
          scale={[particle.scale, particle.scale, particle.scale]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={1.2}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function MagicalParticles({
  selectedHouse,
  isThinking,
  isMobile,
}: {
  selectedHouse: keyof typeof houses | null;
  isThinking: boolean;
  isMobile: boolean;
}) {
  const particlesRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.children.forEach((particle, i) => {
        const baseMovement = Math.sin(state.clock.elapsedTime * 2 + i) * 0.01;
        particle.position.y += baseMovement;
        particle.rotation.x += 0.01;
        particle.rotation.y += 0.015;
      });
    }
  });

  const particleColor = selectedHouse
    ? houses[selectedHouse].accent
    : "#ffd700";
  const particleCount = isThinking ? 25 : 35;

  // Posicionamiento responsivo para seguir al sombrero
  const particlePosition: [number, number, number] = isMobile
    ? [0, 1, 0]
    : [-8, -3, 0];

  return (
    <group ref={particlesRef} position={particlePosition}>
      {[...Array(particleCount)].map((_, i) => {
        const radius = 4 + Math.random() * 3;
        const angle = (i / particleCount) * Math.PI * 2;
        const height = Math.random() * 6 - 1;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius,
            ]}
            scale={[0.08, 0.08, 0.08]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial
              color={particleColor}
              emissive={particleColor}
              emissiveIntensity={0.7}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function AtmosphericFog({
  selectedHouse,
  isThinking,
  isLumosActive,
}: {
  selectedHouse: keyof typeof houses | null;
  isThinking: boolean;
  isLumosActive: boolean;
}) {
  const fogRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (fogRef.current) {
      fogRef.current.children.forEach((particle, i) => {
        const child = particle as THREE.Mesh;
        const baseMovement = {
          x:
            Math.sin(state.clock.elapsedTime * (isLumosActive ? 1 : 0.5) + i) *
            (isLumosActive ? 0.006 : 0.003),
          y:
            Math.sin(
              state.clock.elapsedTime * (isLumosActive ? 0.4 : 0.2) + i
            ) * (isLumosActive ? 0.002 : 0.001),
          z:
            Math.cos(
              state.clock.elapsedTime * (isLumosActive ? 0.6 : 0.3) + i
            ) * (isLumosActive ? 0.004 : 0.002),
        };

        child.position.x += baseMovement.x;
        child.position.y += baseMovement.y;
        child.position.z += baseMovement.z;
        child.rotation.y += isLumosActive ? 0.01 : 0.005;
      });
    }
  });

  // Determinar color de la niebla según la casa seleccionada
  const getFogColor = () => {
    if (isLumosActive) {
      return { base: "#4A90E2", emissive: "#87CEEB" }; // Azul brillante para Lumos
    }
    if (selectedHouse) {
      switch (selectedHouse) {
        case "gryffindor":
          return { base: "#8B0000", emissive: "#DC143C" }; // Rojo carmesí
        case "hufflepuff":
          return { base: "#B8860B", emissive: "#FFD700" }; // Amarillo dorado
        case "ravenclaw":
          return { base: "#003366", emissive: "#0052CC" }; // Azul real
        case "slytherin":
          return { base: "#006400", emissive: "#228B22" }; // Verde bosque
        default:
          return { base: "#2c3e50", emissive: "#34495e" };
      }
    }
    if (isThinking) {
      return { base: "#4B0082", emissive: "#9370DB" }; // Púrpura durante el pensamiento
    }
    return { base: "#2c3e50", emissive: "#34495e" }; // Color por defecto
  };

  const fogColors = getFogColor();
  const particleCount = isLumosActive ? 20 : 12; // Más partículas cuando Lumos está activo

  return (
    <group ref={fogRef}>
      {[...Array(particleCount)].map((_, i) => {
        const x = (Math.random() - 0.5) * 20;
        const y = Math.random() * 6 - 2;
        const z = Math.random() * -8 - 2;
        const scale = isLumosActive
          ? 0.6 + Math.random() * 1.8
          : 0.4 + Math.random() * 1.2;
        return (
          <mesh
            key={i}
            position={[x, y, z]}
            scale={[scale, scale * 0.3, scale]}
            rotation={[0, Math.random() * Math.PI, 0]}
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial
              color={fogColors.base}
              transparent
              opacity={isLumosActive ? 0.25 : selectedHouse ? 0.12 : 0.08}
              emissive={fogColors.emissive}
              emissiveIntensity={
                isLumosActive ? 0.4 : selectedHouse ? 0.08 : 0.04
              }
            />
          </mesh>
        );
      })}

      {/* Partículas adicionales de luz cuando Lumos está activo */}
      {isLumosActive && (
        <>
          {[...Array(15)].map((_, i) => {
            const x = (Math.random() - 0.5) * 25;
            const y = Math.random() * 10 - 3;
            const z = Math.random() * -12 - 2;
            const scale = 0.1 + Math.random() * 0.3;
            return (
              <mesh
                key={`lumos-${i}`}
                position={[x, y, z]}
                scale={[scale, scale, scale]}
              >
                <sphereGeometry args={[1, 6, 6]} />
                <meshStandardMaterial
                  color="#E0F6FF"
                  transparent
                  opacity={0.8}
                  emissive="#87CEEB"
                  emissiveIntensity={1.2}
                />
              </mesh>
            );
          })}
        </>
      )}
    </group>
  );
}

// Precargar los modelos
useGLTF.preload("/models/sorting_hat_fan_art.glb");
useGLTF.preload("/models/elder_wand.glb");
