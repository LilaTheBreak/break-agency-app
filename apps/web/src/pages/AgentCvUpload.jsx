import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, CheckCircle } from "lucide-react";

export default function AgentCvUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    cvFile: null,
    experienceNotes: ""
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a PDF or Word document");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setError("");
      setForm({ ...form, cvFile: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.cvFile) {
      setError("Please upload your CV");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("cv", form.cvFile);
      if (form.experienceNotes) {
        formData.append("experienceNotes", form.experienceNotes);
      }

      const response = await fetch("/api/agent/application", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to submit application");
      }

      setSuccess(true);
      
      // Redirect to careers page after 2 seconds
      setTimeout(() => {
        navigate("/careers", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("[AGENT CV] Error:", err);
      setError(err.message || "Unable to submit application");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-brand-linen px-6 py-16 flex items-center justify-center text-brand-black">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold uppercase tracking-[0.25em]">Application Received</h1>
            <p className="text-sm text-brand-black/70">
              Thanks — we've received your application and will be in touch soon.
            </p>
          </div>
          <p className="text-xs text-brand-black/50">Redirecting to careers page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-linen px-6 py-16 text-brand-black">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-red">Agent Application</p>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.25em]">Submit Your CV</h1>
          <p className="text-sm text-brand-black/70">
            Upload your CV and tell us about your experience representing talent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-[34px] border border-brand-black/10 bg-brand-white p-8 shadow-[0_30px_90px_rgba(0,0,0,0.15)]">
          {/* CV Upload */}
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-3">
              CV / Resume <span className="text-brand-red">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="cv-upload"
              />
              <label
                htmlFor="cv-upload"
                className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-black/20 bg-brand-white/90 px-6 py-8 transition hover:border-brand-red hover:bg-brand-red/5"
              >
                {form.cvFile ? (
                  <>
                    <FileText className="h-6 w-6 text-brand-red" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-brand-black">{form.cvFile.name}</p>
                      <p className="text-xs text-brand-black/60">
                        {(form.cvFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-brand-black/40" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-brand-black">Click to upload</p>
                      <p className="text-xs text-brand-black/60">PDF or Word document (max 10MB)</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Experience Notes */}
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              Areas of Experience <span className="text-brand-black/40">(Optional)</span>
            </label>
            <textarea
              value={form.experienceNotes}
              onChange={(e) => setForm({ ...form, experienceNotes: e.target.value })}
              placeholder="E.g., Sports talent, influencer marketing, brand partnerships..."
              rows={4}
              className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none resize-none"
            />
          </div>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || !form.cvFile}
              className="w-full rounded-full bg-brand-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:bg-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:bg-brand-black/40"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
            
            <button
              type="button"
              onClick={() => navigate("/careers")}
              className="w-full text-center text-xs text-brand-black/60 hover:text-brand-black py-2"
            >
              View careers page instead
            </button>
          </div>

          <div className="pt-4 border-t border-brand-black/10">
            <p className="text-xs text-brand-black/60 text-center">
              By submitting, you agree that we may contact you about agent opportunities at The Break.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
