import React from "react";
import { Link } from "react-router-dom";
import { Shirt, Sparkles, Leaf, BarChart3 } from "lucide-react";
import { Button } from "./components/ui/button";
import heroImg from "./assets/hero-wardrobe.jpg";

const features = [
  { icon: Shirt, title: "Digital Closet", desc: "Organize your entire wardrobe digitally" },
  { icon: Sparkles, title: "AI Outfit Suggestions", desc: "Get personalized outfit ideas daily" },
  { icon: Leaf, title: "Sustainable Fashion", desc: "Track and reduce fashion waste" },
  { icon: BarChart3, title: "Wardrobe Insights", desc: "Analytics on your wearing habits" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative flex flex-col items-center px-6 pt-16 pb-12 text-center">
        <div className="mb-6 h-48 w-48 overflow-hidden rounded-full border-4 border-accent shadow-lg">
          <img src={heroImg} alt="Stylish wardrobe" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Style<span className="text-primary">Vault</span>
        </h1>
        <p className="mt-2 text-lg font-medium text-primary">Your Smart AI Digital Wardrobe</p>
        <p className="mt-3 max-w-sm text-muted-foreground">
          Digitize your closet, get AI-powered outfit suggestions, and embrace sustainable fashion — all in one app.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-16">
        <h2 className="mb-6 text-center text-xl font-semibold text-foreground">Why StyleVault?</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-center rounded-lg bg-card p-5 text-center shadow-sm animate-fade-in"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Landing;