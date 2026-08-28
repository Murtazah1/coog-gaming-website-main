"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  removeOwnAvatar,
  updateOwnAvatar,
  updateOwnProfile,
} from "@/server/nonAdminUsers";

const MAX_AVATAR_SIZE = 1024 * 1024;
const allowedAvatarTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type ProfileInformationCardProps = {
  firstName: string | null;
  lastName: string | null;
  gamerName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export function ProfileInformationCard({
  firstName: initialFirstName,
  lastName: initialLastName,
  gamerName: initialGamerName,
  avatarUrl: initialAvatarUrl,
  createdAt,
}: ProfileInformationCardProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileFormRef = useRef<HTMLFormElement>(null);
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [gamerName, setGamerName] = useState(initialGamerName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  useEffect(() => {
    setFirstName(initialFirstName ?? "");
    setLastName(initialLastName ?? "");
    setGamerName(initialGamerName ?? "");
    profileFormRef.current?.reset();
  }, [initialFirstName, initialLastName, initialGamerName]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "CG";

  const selectAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setAvatarFile(null);
      return;
    }

    if (!allowedAvatarTypes.has(file.type)) {
      toast.error("Choose a PNG, JPG, WEBP, or GIF image.");
      event.target.value = "";
      setAvatarFile(null);
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Profile pictures must be under 1MB.");
      event.target.value = "";
      setAvatarFile(null);
      return;
    }

    setAvatarFile(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) {
      toast.error("Choose an image first.");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.set("file", avatarFile);
      const result = await updateOwnAvatar(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setAvatarUrl(result.data?.avatarUrl ?? null);
      setAvatarFile(null);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }

      toast.success("Profile picture updated.");
      router.refresh();
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setIsRemovingAvatar(true);

    try {
      const result = await removeOwnAvatar();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setAvatarUrl(null);
      setAvatarFile(null);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }

      toast.success("Profile picture removed.");
      router.refresh();
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateOwnProfile({ firstName, lastName, gamerName });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Profile updated.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-red-500/25 bg-black/90 font-sans text-base font-bold text-white shadow-xl backdrop-blur-xl [&_button]:text-base [&_button]:font-bold [&_input]:text-base [&_label]:text-base [&_label]:font-bold">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold">
          Profile information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-7">
        <div className="grid gap-4 border-b border-white/10 pb-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="size-24 border-2 border-red-500/40 bg-zinc-900 shadow-lg">
              <AvatarImage
                src={avatarPreviewUrl ?? avatarUrl ?? undefined}
                alt="Profile picture preview"
                className="object-cover"
              />
              <AvatarFallback className="bg-zinc-900 text-2xl font-semibold text-zinc-100">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 gap-2">
              <Label htmlFor="profile-picture">Profile picture</Label>
              <Input
                ref={avatarInputRef}
                id="profile-picture"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={selectAvatar}
                disabled={isUploadingAvatar || isRemovingAvatar}
                aria-describedby="profile-picture-help"
                className="file:mr-4 file:font-medium"
              />
              <p
                id="profile-picture-help"
                className="text-base leading-7 text-zinc-300"
              >
                PNG, JPG, WEBP, or GIF. Maximum file size: 1MB.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={uploadAvatar}
              disabled={
                !avatarFile || isUploadingAvatar || isRemovingAvatar
              }
            >
              <ImageUp />
              {isUploadingAvatar ? "Uploading..." : "Upload picture"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={removeAvatar}
              disabled={!avatarUrl || isUploadingAvatar || isRemovingAvatar}
              className="border-red-400/40 bg-transparent text-zinc-100 hover:bg-red-950/50 hover:text-white"
            >
              <Trash2 />
              {isRemovingAvatar ? "Removing..." : "Remove picture"}
            </Button>
          </div>
        </div>
        <form
          ref={profileFormRef}
          className="grid gap-5"
          autoComplete="off"
          onSubmit={saveProfile}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                autoComplete="off"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                autoComplete="off"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gamer-name">Gamer Name</Label>
            <Input
              id="gamer-name"
              autoComplete="off"
              value={gamerName}
              onChange={(event) => setGamerName(event.target.value)}
              placeholder="Your in-game or community name"
            />
          </div>
          <p className="text-base leading-7 text-zinc-300">
            Account created {new Date(createdAt).toLocaleDateString()}.
          </p>
          <Button type="submit" disabled={isSaving} className="w-fit">
            {isSaving ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
