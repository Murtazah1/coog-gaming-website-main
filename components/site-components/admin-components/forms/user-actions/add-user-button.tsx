"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import UserForm from "./user-form";

export default function AddUserButton(){
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = useState(false)
    // important note here, on a successful user add we need to refresh the page to reflect the changes in our DB
    function handleSuccess(){
        setDialogOpen(false)
        router.refresh()
    }

    return (
        <> 
            <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add User</DialogTitle>
                        <DialogDescription>
                            Create A New User
                        </DialogDescription>
                    </DialogHeader>
                    {/* since we are adding a user we do not need to return the user as a prop */}
                    <UserForm 
                    mode="create"
                    onSuccess={handleSuccess}
                    onCancel={() => setDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        
        </>
    )
}