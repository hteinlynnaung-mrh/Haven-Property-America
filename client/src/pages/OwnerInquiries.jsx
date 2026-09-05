import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../toast.jsx';
import { EmptyState } from '../ListingCard.jsx';

const STATUS_STYLES = {
  new: 'bg-amber-50 text-amber-800 border-amber-200',
  read: 'bg-blue-50 text-blue-700 border-blue-200',
  replied: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export function OwnerInquiries() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const toast = useToast();

  function load() {
    api('/api/owner/inquiries').then((d) => setItems(d.items));
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    await api(`/api/owner/inquiries/${id}`, { method: 'PATCH', body: { status } });
    toast.push(`Marked as ${status}`);
    load();
  }

  async function handleSendReply(id) {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await api(`/api/owner/inquiries/${id}`, {
        method: 'PATCH',
        body: { reply: replyText.trim() },
      });
      toast.push('Reply sent to buyer');
      setReplyingId(null);
      setReplyText('');
      load();
    } catch (err) {
      toast.push(err.message, 'err');
    } finally {
      setSendingReply(false);
    }
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  const counts = {
    all: items.length,
    new: items.filter((i) => i.status === 'new').length,
    read: items.filter((i) => i.status === 'read').length,
    replied: items.filter((i) => i.status === 'replied').length,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Listing Inquiries</h1>
          <p className="mt-1 text-sm text-ink/60">Messages and inquiries from interested buyers and renters</p>
        </div>
        <div className="flex rounded-full border border-sand bg-white p-1 text-xs font-medium">
          {['all', 'new', 'read', 'replied'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3 py-1 capitalize transition-colors ${
                filter === tab ? 'bg-forest text-white' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No inquiries found" body={filter === 'all' ? 'Inquiries from buyers will show up here.' : `No inquiries marked as "${filter}".`} />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {filtered.map((i) => (
            <li key={i.id} className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <div className="flex gap-4">
                {i.listingImage && (
                  <Link to={`/listings/${i.listingId}`} className="shrink-0 overflow-hidden rounded-xl bg-sand">
                    <img src={i.listingImage} alt="" className="h-20 w-28 object-cover hover:scale-105 transition-transform" />
                  </Link>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/listings/${i.listingId}`} className="font-medium hover:text-forest transition-colors">
                        {i.listingTitle}
                      </Link>
                      <p className="text-sm text-ink/60">
                        From <strong className="text-ink font-semibold">{i.name}</strong> · <a href={`mailto:${i.email}`} className="text-forest hover:underline">{i.email}</a> {i.phone ? `· ${i.phone}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLES[i.status] || 'bg-sand text-ink/70'}`}>
                      {i.status}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl bg-cream/50 p-3 text-sm leading-relaxed text-ink/90">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 mb-1">Buyer message</p>
                    {i.message}
                  </div>

                  {i.ownerReply && (
                    <div className="mt-3 rounded-xl bg-forest/5 border border-forest/15 p-3 text-sm leading-relaxed text-ink/90">
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-forest mb-1">
                        <span>Your Reply</span>
                        <span className="text-ink/40 font-normal">{i.repliedAt ? new Date(i.repliedAt).toLocaleDateString() : ''}</span>
                      </div>
                      <p>{i.ownerReply}</p>
                    </div>
                  )}

                  {replyingId === i.id ? (
                    <div className="mt-4 rounded-xl border border-forest/20 bg-cream/30 p-3">
                      <p className="text-xs font-medium text-forest mb-2">Write reply to {i.name}</p>
                      <textarea
                        rows="3"
                        className="w-full rounded-lg border border-sand bg-white p-2.5 text-sm outline-none focus:border-forest"
                        placeholder="Write your response, tour availability, or contact info…"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="mt-2 flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => { setReplyingId(null); setReplyText(''); }}
                          className="rounded-full border border-sand bg-white px-3 py-1 text-ink/70"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!replyText.trim() || sendingReply}
                          onClick={() => handleSendReply(i.id)}
                          className="rounded-full bg-forest px-4 py-1 font-medium text-white shadow-sm hover:bg-moss disabled:opacity-50"
                        >
                          {sendingReply ? 'Sending…' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink/40">{i.createdAt}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => { setReplyingId(replyingId === i.id ? null : i.id); setReplyText(i.ownerReply || ''); }}
                        className="rounded-full bg-forest px-3.5 py-1.5 text-white hover:bg-moss transition-colors shadow-sm"
                      >
                        {i.ownerReply ? 'Edit Reply' : 'Reply in App 💬'}
                      </button>
                      <a
                        href={`mailto:${i.email}?subject=Re: Inquiry on ${encodeURIComponent(i.listingTitle)}`}
                        className="rounded-full border border-sand bg-white px-3.5 py-1.5 text-ink/70 hover:border-forest/40 transition-colors"
                      >
                        Email ✉
                      </a>
                      <span className="text-ink/30">|</span>
                      <span className="text-ink/50">Status:</span>
                      {['new', 'read', 'replied'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={i.status === st}
                          onClick={() => setStatus(i.id, st)}
                          className={`rounded-full border px-3 py-1 capitalize transition-colors ${
                            i.status === st
                              ? 'border-forest bg-forest/10 text-forest font-semibold cursor-default'
                              : 'border-sand bg-white text-ink/70 hover:border-forest/40'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
