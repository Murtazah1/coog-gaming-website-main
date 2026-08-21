"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { User } from "@/db/schema/users";
import { uploadAvatar } from "@/server/storage";
import { createUser, updateUser } from "@/server/users";
import Image from "next/image";
import { CircleX } from "lucide-react";

// this form will be used for both editing and updating users as it is more convinient to keep that all in 1 form

// schemas for our forms to make sure the right inputs go in
const baseSchema = z.object({
  email: z.email("Enter in a valid email address"),
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
});

const createSchema = baseSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const editSchema = baseSchema.extend({
  password: z.string().optional(),
});

// this creates types from our zod schemas
// useful as this makes the zod types a good source of truth
// and we do not need to sync types

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// since this form supports both updating and creating, it is useful to create a union type that covers this all
type FormValues = CreateValues | EditValues;

interface CreateProps {
  mode: "create";
  user?: never;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface EditProps {
  mode: "edit";
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// interfacing for props is good so the prop types that are entered in are what we expect
type UserFormProps = CreateProps | EditProps;

// here we pass in the mode: either create or edit, the user
// we pass in onSuccess and onCancel so if the user either submits the form or cancels it
// this form can call the associated function passed into it from the parent that called it
// In React/Nextjs, the parent owns the state and the child is given functions to request
// changes to the state
// in the case of the admin user form, this function will tell the UserRowActions to close the dialogue on success and refresh the webpage
// on cancel it will just close the dialogue form
export default function UserForm({ mode, user, onSuccess, onCancel }: UserFormProps) {
  // a bool used to determine if we are creating a user or updating a user
  const isCreate = mode === "create";
  // used to handle file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.avatarUrl ?? null,
  );
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  // state for when we are uploading information to the DB
  const [uploading, setUploading] = useState(false);

  // when making a shadcn form, we have a type the form returns and we have default values
  const form = useForm<FormValues>({
    resolver: zodResolver(isCreate ? createSchema : editSchema),
    defaultValues: {
      email: user?.email ?? "",
      password: "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    const newObjectUrl = URL.createObjectURL(file);

    setObjectUrl(newObjectUrl);
    setPreviewUrl(newObjectUrl);

    setRemoveAvatar(false);
  }

  function handleRemoveAvatar() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    setPreviewUrl(null);

    setRemoveAvatar(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function onSubmit(values: FormValues) {
    // setUploading to true as we are uploading information
    setUploading(true);
    try {
      // first we get the avatar profile picture from the files they may have uploaded
      // as I want to use this form for both creating and updating, I have to assume that
      // there may not be a preexiting user or a file upload
      let avatarUrl = removeAvatar ? null : (user?.avatarUrl ?? null);
      const file = fileInputRef.current?.files?.[0];
      // if we have a file make a new FormData object and use the uploadAvatar function we defined in our storage.ts
      if (file) {
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadAvatar(formData);

        if (result.error) return toast.error(result.error);
        avatarUrl = result.url;
      }
      // define a payload with all the values the user submitted
      const payload = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        avatarUrl,
      };
      // if we are creating a user then
      const res = isCreate
        ? // we run the create user function we defined in users.ts
          await createUser({
            // spread the payload as that is what we are uploading
            ...payload,
            // and then type cast values as createvalues to make sure it is using the create form
            password: (values as CreateValues).password,
          })
        : // if we are updating then just update the user
          await updateUser(user.id, payload);

      if (res?.error) return toast.error(res.error);

      toast.success(`User ${isCreate ? "created" : "updated"} successfully.`);
      form.reset();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
      }

      setPreviewUrl(null);
      setRemoveAvatar(false);
      // run onsuccess to let the parent know that they can refresh the page/close the dialogue
      onSuccess?.();
    } catch {
      toast.error("An error has occured");
    } finally {
      setUploading(false);
    }
  }

  const fields = [
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "user@example.com",
      show: true,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Min 8 characters",
      show: isCreate,
    },
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      placeholder: "Tyler",
      show: true,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: "One",
      show: true,
    },
  ] as const;

  return (
    // We spread the zod form we made above onto here, this is important as this grants us type validation in our form from zod
    <Form {...form}>
      {/* on submit we go and submit in our informaiton, our form.handleSubmit takes in the function we will be using to handleSubmit, which will be the onSubmit function we defined up above */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* for every entry in fields, we make a new form field input thing for it */}
        {fields.map(
          ({ name, label, type, placeholder, show }) =>
            // only make an input for this fields element if show is true
            show && (
              <FormField
                key={name}
                // control lets us know to use the form defined up above for validation and whatnot
                control={form.control}
                name={name}
                // this code is essentially saying in this FormField render this react user input field
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    {/* this is the start of the actual input */}
                    <FormControl>
                      <Input
                        {...field}
                        type={type}
                        placeholder={placeholder}
                        autoComplete={
                          type === "password" ? "new-password" : "off"
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ),
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Avatar</label>
          {/* show the image if the preview url exists */}
          {previewUrl && (
            <div className="flex items-center gap-4">
              <Image
                src={previewUrl}
                alt="Avatar Preview"
                width={80}
                height={80}
                className="rounded-full object-cover border"
              />

              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-red-500 hover:text-red-700"
                aria-label="Remove profile picture"
              >
                <CircleX className="h-6 w-6" />
              </button>
            </div>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">
            Optional. Max 1MB. Formats: PNG, JPEG, WebP, GIF.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          {/* show this button if onCancel was passed onto the form */}
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            // if this form is submitting information/uploading then the submit button is disabled
            // we use uploading to determine this as in our onSubmit function, uploading is set to true when we are accessing the DB and putting our informaiton in
            // if all goes well we set it to false at the end
            disabled={form.formState.isSubmitting || uploading}
          >
            {/* if uploading show uploading, else if isCreate show add user else show Save Changes */}
            {uploading
              ? "Uploading..."
              : isCreate
                ? "Add User"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}


