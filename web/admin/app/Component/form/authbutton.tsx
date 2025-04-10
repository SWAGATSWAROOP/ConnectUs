"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

const AuthButtons = () => {
    const { data: session } = useSession();
    const { toast } = useToast();

    const handleLogout = async () => {
        await signOut({ redirect: false, callbackUrl: "/" });
        toast({
            title: "Logged Out Successfully",
            description: "See you soon",
        });
        window.location.replace("/");
    };

    if (session) {
        return (
            <div>
                <Button onClick={handleLogout} variant="destructive">
                    Logout
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/signup">Create Admin</Link>
                </Button>
            </div>
        );
    } else {
        return (
            <div className="flex space-x-2">
                <Button variant="outline" asChild>
                    <Link href="/SignIn">Sign In</Link>
                </Button>
            </div>
        );
    }
};

export default AuthButtons;
