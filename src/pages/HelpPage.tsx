import { Link } from 'react-router-dom';

export function HelpPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-violet-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-white font-semibold">Help Center</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Need Help?</h1>
          <p className="text-xl text-neutral-400">Find answers to common questions below</p>
        </div>

        <div className="space-y-6">
          <FAQItem
            question="Video is not playing"
            answer="Make sure you have a stable internet connection. Try refreshing the page. If the issue persists, try using a different browser like Chrome or Firefox. Also ensure that JavaScript is enabled in your browser settings."
          />

          <FAQItem
            question="I can't hear any audio"
            answer="Click the 'Join Audio' button that appears over the video. If you still can't hear audio, check that your device volume is turned up and not muted. Also verify that your browser has permission to play audio."
          />

          <FAQItem
            question="The video is buffering or lagging"
            answer="This is usually due to a slow internet connection. Try lowering other bandwidth usage on your network. Close other tabs and applications that might be using your internet. If possible, switch to a wired connection instead of WiFi."
          />

          <FAQItem
            question="I'm seeing 'Device limit reached' error"
            answer="You can only watch the stream on one device at a time. Make sure you've closed the stream on any other devices or browser tabs. If you're sure you don't have it open elsewhere, wait a minute and try refreshing the page."
          />

          <FAQItem
            question="My email is not being recognized"
            answer="Make sure you're using the same email address you registered with at Codekaro. Double-check for typos. If you're still having issues, contact support at support@codekaro.in."
          />

          <FAQItem
            question="The countdown timer is stuck"
            answer="The page should automatically refresh when the session starts. If the countdown reaches zero but nothing happens, try refreshing the page manually."
          />

          <FAQItem
            question="Chat messages are not sending"
            answer="Check your internet connection. If messages still aren't sending, try refreshing the page. There's a 500 character limit per message."
          />

          <FAQItem
            question="I joined late, can I watch from the beginning?"
            answer="Live sessions are meant to be watched in real-time. When you join, you'll be synced to the current point in the stream. Replays may be available after the session ends."
          />
        </div>

        {/* Contact section */}
        <div className="mt-12 p-6 bg-neutral-800/50 rounded-2xl border border-neutral-700 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Still need help?</h2>
          <p className="text-neutral-400 mb-4">Contact our support team</p>
          <a
            href="mailto:support@codekaro.in"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            support@codekaro.in
          </a>
        </div>
      </main>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="p-6 bg-neutral-800/30 rounded-xl border border-neutral-800">
      <h3 className="text-lg font-semibold text-white mb-2 flex items-start gap-2">
        <svg className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {question}
      </h3>
      <p className="text-neutral-400 pl-7">{answer}</p>
    </div>
  );
}
