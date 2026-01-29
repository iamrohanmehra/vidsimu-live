import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: "Video is not playing",
    answer: "Make sure you have a stable internet connection. Try refreshing the page. If the issue persists, try using a different browser like Chrome or Firefox. Also ensure that JavaScript is enabled.",
  },
  {
    question: "I can't hear any audio",
    answer: "Click the 'Join Audio' button that might appear. Check your device volume and ensure the tab isn't muted. Verify browser permissions for audio playback.",
  },
  {
    question: "Video buffering or lagging",
    answer: "This is usually network-related. Close other bandwidth-heavy apps/tabs. If on WiFi, try moving closer to the router or switching to a wired connection.",
  },
  {
    question: "'Device limit reached' error",
    answer: "You can only watch on one device at a time. Close the stream on other devices/tabs. Wait a minute and refresh if you're sure it's closed elsewhere.",
  },
  {
    question: "Email not recognized",
    answer: "Use the exact email registered with Codekaro. Check for typos. If issues persist, please contact support for account verification.",
  },
  {
    question: "Timer is stuck",
    answer: "The page should auto-refresh when the session starts. If the countdown reaches zero with no change, manually refresh the page.",
  },
  {
    question: "Chat messages not sending",
    answer: "Check internet connection. Refresh the page. accurate character limits apply (500 chars).",
  },
  {
    question: "Joining late?",
    answer: "Sessions are live synced. You will join at the current moment in the stream. Replays may be available after the session ends.",
  },
];

export function HelpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we came from a specific page (e.g., live session)
  const from = location.state?.from;
  const isFromLiveSession = from && (from.startsWith('/s/') || from.startsWith('/a/'));
  const backLabel = isFromLiveSession ? 'Back to Live Session' : 'Back to Dashboard';
  const backPath = from || '/';

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950 font-sans text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-10 supports-backdrop-filter:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(backPath)} 
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Button>
          <span className="font-medium text-sm text-foreground/80">Help Center</span>
        </div>
      </header>
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <main className="max-w-4xl mx-auto px-4 py-12 relative">
        <div className="mb-12 text-center max-w-2xl mx-auto">
             <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">How can we help?</h1>
             <p className="text-muted-foreground text-lg">Browse common questions below or contact our support team for direct assistance.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
             {FAQS.map((faq, i) => (
               <Card key={i} className="shadow-sm border-border/60 hover:border-border transition-colors bg-card/50 backdrop-blur-sm">
                 <CardHeader className="pb-3">
                   <CardTitle className="text-base font-semibold flex items-start gap-2.5">
                     <HelpCircle className="w-5 h-5 text-primary/80 shrink-0 mt-0.5" />
                     <span className="leading-tight">{faq.question}</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="text-sm text-muted-foreground leading-relaxed">
                   {faq.answer}
                 </CardContent>
               </Card>
             ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12">
           <Card className="border-border shadow-sm bg-primary/5">
              <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
                 <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2 text-foreground">Still need assistance?</h3>
                    <p className="text-muted-foreground">Our support team is standing by to help you with any technical issues.</p>
                 </div>
                 <Button size="lg" className="gap-2 shadow-md shrink-0" onClick={() => window.location.href = 'mailto:support@codekaro.in'}>
                    <Mail className="w-4 h-4" />
                    Contact Support
                 </Button>
              </CardContent>
           </Card>
        </div>

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Codekaro. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
