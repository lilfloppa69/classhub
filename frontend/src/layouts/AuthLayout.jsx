import doodle from '../assets/Doodle.png'

export default function AuthLayout({ children, title }) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* LEFT */}
      <div className="w-3/7 bg-gray-100 relative flex items-center justify-center">
        {/* LOGO */}
        <img
          src="/JaktViggen.svg"
          alt="logo"
          className="absolute top-1 left-6 w-20"
        />

        <div className="flex flex-col gap-5 w-[350px]">
          <h1 className="text-2xl font-bold text-center text-blue-600">
            {title}
          </h1>

          {children}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-4/7 relative bg-[#1E1B8F] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={doodle}
            alt="doodle"
            className="w-[115%] h-[115%] object-cover opacity-70 animate-doodle-float"
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={doodle}
            alt="doodle"
            className="w-[120%] h-[120%] object-cover opacity-80 animate-doodle-breathe"
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-br from-transparent via-indigo-800/10 to-black/20" />
        <div className="absolute inset-0 backdrop-blur-[0.5px]" />
      </div>
    </div>
  )
}
