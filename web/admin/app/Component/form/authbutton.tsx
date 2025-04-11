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
            <div className="flex gap-3 justify-end mt-4">
                <Button onClick={handleLogout} variant="outline" className="shadow-md">
                    Logout
                </Button>

                <Button variant="outline" asChild className="shadow-sm">
                    <Link href="/SignUp">Create Admin</Link>
                </Button>

                <Button variant="outline" asChild className="shadow-sm">
                    <Link href="/admin">Fare Stats</Link>
                </Button>
            </div>
        );
    } else {
        return (
            <div className="flex space-x-2">
                <Button variant="outline" className="bg-blue-700" asChild>
                    <Link href="/SignIn" className="text-white">Get started &gt;</Link>
                </Button>
            </div>
        );
    }
};

export default AuthButtons;
