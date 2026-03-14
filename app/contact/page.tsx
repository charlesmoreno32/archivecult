export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-50 -mt-[88px] pt-[88px]">
      {/* Background extends behind header */}
      <div className="p-4 pt-8">
        {/* pt-8 adds extra top padding for the content */}
        <div className="max-w-lg">
          <h1 className="text-lg font-bold text-black tracking-wide">
            Contact
          </h1>
          <div className="mt-3 h-px w-12 bg-zinc-400" />
          <p className="mt-6 text-sm text-black leading-relaxed">
            Feel free to send emails with any questions.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Business, collaborations, or general inquiries.
          </p>
          <p className="mt-6 text-sm font-medium text-black">
            archivecult@outlook.com
          </p>
          <p className="mt-2 text-xs text-zinc-500 uppercase tracking-wide">
            Replies may take time
          </p>
        </div>
      </div>
    </div>
  );
}
