import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    return (
        <div className="mt-4 ml-4 relative">
            <Link
                href={"/"}
                
            >
                <Image src={'/connectus_web.png'} alt="image" height={200} width={200} />
            </Link>
        </div>
    )
}