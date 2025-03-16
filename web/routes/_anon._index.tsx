import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function () {
  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="w-full rounded-lg overflow-hidden shadow-xl">
        <img 
          src="/main.jpg" 
          alt="Welcome Image" 
          className="w-full h-auto object-cover" 
        />
      </div>
      
      <Card className="p-8 w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">👋 Hey, Developer!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base">
          Start building your app&apos;s signed out area in <a
            href="/edit/files/web/routes/_anon._index.jsx"
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            web/routes/_anon._index.jsx
          </a>
        </p>
        
        <Button
          variant="default"
          size="lg"
          className="w-full"
          asChild
        >
          <Link to="/sign-up">Sign up</Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          asChild
        >
          <Link to="/sign-in">Sign in</Link>
        </Button>
        
      </CardContent>
    </Card>
    </div>
  );
}
