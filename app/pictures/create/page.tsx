"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, X, Camera, RefreshCw, MapPin, Tag } from "lucide-react";
import Link from "next/link";
import { usePictureStore } from "@/store/pictureStore";
import { useToast } from "@/hooks/useToast";
import Spinner from "@/components/ui/Spinner";

const UploadPicture = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [story, setStory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const { uploadPicture, loading } = usePictureStore();
  const { showToast } = useToast();

  const blobUrlRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraMode(false);
  };

  const startCamera = async () => {
    setIsCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setIsCameraMode(false);
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.92),
    );

    if (!blob) return;

    const capturedFile = new File([blob], `camera-${Date.now()}.webp`, {
      type: "image/webp",
    });

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(capturedFile);
    blobUrlRef.current = url;

    setFile(capturedFile);
    setPreviewUrl(url);

    stopCamera();
  };

  const clearFile = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreviewUrl(null);
    setFile(null);
    stopCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const inputStyle =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-600/50 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sm";
  const labelStyle =
    "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2";

  const handleUploadPicture = async () => {
    if (!file) return showToast("Please select or take a photo first", "error");
    if (!title || !story || !location || !tags) {
      return showToast("Please fill in all fields", "info");
    }

    const userId = "69972ffe9a21372622fcff10";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("title", title);
    formData.append("story", story);
    formData.append("location", location);
    formData.append("tags", JSON.stringify(tags));

    try {
      await uploadPicture(formData);
      showToast("Picture uploaded successfully", "success");
      clearFile();
      setTitle("");
      setStory("");
      setLocation("");
      setTags([]);
      setTagsInput("");
    } catch (e: any) {
      showToast(e?.message || "Error while uploading picture", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      <header className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-bold text-xl tracking-tight">
            Gallery.
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-400">
            Cancel
          </Link>
        </div>
      </header>

      <main className="grow flex items-center justify-center p-6 py-12">
        <div
          className={`w-full transition-all duration-500 ${
            previewUrl ? "max-w-5xl" : "max-w-2xl"
          } bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-indigo-100`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 ">
            <div
              className={`${previewUrl ? "lg:col-span-5" : "lg:col-span-12"}`}
            >
              {!previewUrl && !isCameraMode && (
                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-900">
                      Add New Photo
                    </h1>
                    <p className="text-slate-500">
                      Upload a file or snap a fresh one.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 hover:bg-slate-50 cursor-pointer transition-all">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;

                          if (blobUrlRef.current)
                            URL.revokeObjectURL(blobUrlRef.current);

                          const url = URL.createObjectURL(f);
                          blobUrlRef.current = url;

                          setFile(f);
                          setPreviewUrl(url);

                          e.currentTarget.value = "";
                        }}
                      />
                      <Upload className="w-8 h-8 text-indigo-600 mb-2" />
                      <span className="font-bold">Upload</span>
                    </label>

                    <button
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center p-8 border-2 border-indigo-100 bg-indigo-50/30 rounded-3xl hover:bg-indigo-50 transition-all group"
                      type="button"
                    >
                      <Camera className="w-8 h-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-indigo-900">
                        Snap Photo
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {isCameraMode && (
                <div className="relative rounded-4xl overflow-hidden bg-black aspect-3/4 shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6">
                    <button
                      onClick={stopCamera}
                      className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white"
                      type="button"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    <button
                      onClick={takePhoto}
                      className="w-20 h-20 bg-white rounded-full border-[6px] border-white/30 flex items-center justify-center shadow-2xl"
                      type="button"
                    >
                      <div className="w-14 h-14 bg-indigo-600 rounded-full" />
                    </button>

                    <button
                      className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white opacity-50 cursor-not-allowed"
                      type="button"
                      disabled
                      title="Coming soon"
                    >
                      <RefreshCw className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {previewUrl && (
                <div className="sticky top-28">
                  <div className="relative rounded-4xl aspect-5/6 overflow-hidden shadow-2xl">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={clearFile}
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full text-red-600 shadow-xl"
                      type="button"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelStyle}>Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      type="text"
                      placeholder="Summer Bliss"
                      className={inputStyle}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelStyle}>Story</label>
                    <textarea
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      placeholder="Tell us about this moment..."
                      rows={3}
                      className={`${inputStyle} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelStyle}>
                      <MapPin className="w-3 h-3" /> Location
                    </label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      type="text"
                      placeholder="Paris, France"
                      className={inputStyle}
                    />
                  </div>

                  <div>
                    <label className={labelStyle}>
                      <Tag className="w-3 h-3" /> Tags
                    </label>
                    <input
                      value={tagsInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTagsInput(value);

                        const parsed = value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean);

                        setTags(parsed);
                      }}
                      type="text"
                      placeholder="travel, sunset"
                      className={inputStyle}
                    />
                  </div>
                </div>

                <button
                  className="w-full flex items-center justify-center bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                  type="button"
                  onClick={handleUploadPicture}
                >
                  {loading ? <Spinner size={30} /> : <p> Post to Gallery</p>}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadPicture;
