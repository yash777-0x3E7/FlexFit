import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center gap-8 pt-8">
        <div className="flex-1 space-y-6">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-pastel-text">
            Lift Happy,<br />Feel Fluffy!
          </h1>
          <p className="text-lg text-slate-600 max-w-md font-medium leading-relaxed">
            A cute space to get strong, feel amazing, and love your journey. 💖
          </p>
          <div className="pt-2">
            <Link href="/plans" className="btn btn-primary text-lg px-8 py-4 shadow-xl">
              Start Your Journey 🐾
            </Link>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-pastel-yellow rounded-full blur-3xl opacity-50"></div>
          <Image 
            src="/bunny.png" 
            alt="Cute fluffy bunny lifting weights" 
            width={500} 
            height={500} 
            className="relative z-10 mx-auto drop-shadow-2xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-white/40 shadow-xl shadow-pastel-pink/10">
        {[
          ["💖", "Fun Workouts", "Enjoy workouts that keep you motivated and smiling!"],
          ["⭐", "Expert Trainers", "Our trainers are here to support you every step of the way!"],
          ["☁️", "Cozy Environment", "A friendly, clean, and fluffy space to grow strong together."],
          ["🌟", "Reach Goals", "Big or small, we're here to help you achieve them!"],
        ].map(([emoji, title, blurb]) => (
          <div key={title} className="flex flex-col items-center text-center p-6 space-y-3 bg-white rounded-2xl shadow-sm border border-pastel-pink/30 hover:-translate-y-1 transition-transform">
            <div className="text-4xl">{emoji}</div>
            <h2 className="font-bold text-pastel-text text-lg">{title}</h2>
            <p className="text-slate-500 text-sm">{blurb}</p>
          </div>
        ))}
      </section>

      {/* Why Join Section */}
      <section className="flex flex-col md:flex-row items-center gap-12 bg-pastel-purple/20 p-8 md:p-12 rounded-3xl border border-white">
        <div className="flex-1 space-y-6">
          <h2 className="text-4xl font-extrabold text-pastel-text">
            Why Join<br />AntiGravity?
          </h2>
          <p className="text-slate-600 font-medium">
            We believe fitness should be fun, supportive, and a little bit cute!
          </p>
          <Image 
            src="/bear.png" 
            alt="Cute fluffy bear drinking water" 
            width={400} 
            height={400} 
            className="drop-shadow-2xl mt-8"
          />
        </div>
        
        <div className="flex-1 space-y-6 w-full">
          {[
            ["🏋️‍♀️", "All Fitness Levels", "Whether you're just starting or leveling up, we have something for you!"],
            ["📅", "Flexible Schedule", "Classes and gym access that fit your busy and beautiful life."],
            ["😊", "Community Vibes", "Make new friends and stay motivated together in our fluffy fam!"],
          ].map(([emoji, title, blurb]) => (
            <div key={title} className="bg-white p-6 rounded-2xl shadow-sm border border-pastel-pink/30 flex gap-4 items-center">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-pastel-pink rounded-xl text-2xl">
                {emoji}
              </div>
              <div>
                <h3 className="font-bold text-pastel-text">{title}</h3>
                <p className="text-slate-500 text-sm mt-1">{blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-pastel-pink to-pastel-purple p-10 md:p-16 rounded-3xl text-center space-y-8 border border-white shadow-xl shadow-pastel-purple/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-9xl opacity-10">☁️</div>
        <div className="absolute bottom-0 left-0 text-9xl opacity-10">💖</div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-pastel-text">
            You Don't Have<br />to Be Perfect<br />to Be Here. 💖
          </h2>
          <p className="text-xl text-slate-700 font-bold">
            Just You. Showing Up.
          </p>
        </div>
        <div className="relative z-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl max-w-md mx-auto space-y-4 shadow-lg border border-white">
          <h3 className="font-bold text-pastel-text text-xl">Ready to feel your best?</h3>
          <p className="text-slate-600 text-sm">Let's make today your strongest and cutest day yet! 💪✨</p>
          <Link href="/login" className="btn btn-primary w-full text-lg py-3 mt-4">
            Join Now 🐾
          </Link>
        </div>
      </section>
    </div>
  );
}
