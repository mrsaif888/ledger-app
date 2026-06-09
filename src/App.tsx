import "./App.css";
import supabase from "./supabase";
import { useEffect, useState } from "react";

type Entry = {
  id: number;
  date: string;
  description: string;
  credit: number;
  debit: number;
};

type Company = {
  id: number;
  name: string;
  openingBalance: number;
  entries: Entry[];
};

export default function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);

  const [companyName, setCompanyName] = useState("");

  const [description, setDescription] = useState("");
  const [credit, setCredit] = useState("");
  const [debit, setDebit] = useState("");
  const [entryDate, setEntryDate] = useState(
  new Date().toISOString().substring(0, 10)
);

  const [editingEntry, setEditingEntry] = useState<number | null>(null);

useEffect(() => {
  loadCompanies();
}, []);
async function loadEntries(companyId: number) {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("company_id", companyId)
    .order("entry_date");

  if (error) {
    console.error(error);
    return;
  }

  setCompanies((prev) =>
    prev.map((c) =>
      c.id === companyId
        ? {
            ...c,
            entries: data.map((e) => ({
              id: e.id,
              date: e.entry_date,
              description: e.description,
              credit: Number(e.credit),
              debit: Number(e.debit),
            })),
          }
        : c
    )
  );
}
async function loadCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("*");

  console.log("DATA:", data);

  if (error) {
    console.error("ERROR:", error);
    return;
  }

  const formattedCompanies = data.map((c) => ({
    id: c.id,
    name: c.name,
    openingBalance: c.opening_balance,
    entries: [],
  }));

  setCompanies(formattedCompanies);
  const savedCompany =
  localStorage.getItem(
    "selectedCompany"
  );

if (savedCompany) {

  const companyId =
    Number(savedCompany);

  setSelectedCompany(companyId);

  setTimeout(() => {
    loadEntries(companyId);
  }, 500);

}

  
}
 
useEffect(() => {
  async function test() {
    const { data, error } = await supabase
      .from("companies")
      .select("*");

    console.log("DATA:", data);

    if (error) {
      console.log("ERROR MESSAGE:", error.message);
      console.log("ERROR DETAILS:", error);
    }
  }

  test();
}, []);
  const company = companies.find(
    (c) => c.id === selectedCompany
  );

  const currentBalance = (company: Company) => {
    return company.entries.reduce(
      (balance, entry) =>
        balance + entry.credit - entry.debit,
      company.openingBalance
    );
  };

  const addCompany = async () => {
    if (!companyName.trim()) return;

    const openingBalance = Number(
      prompt("Opening Balance", "0") || "0"
    );

    const newCompany: Company = {
      id: Date.now(),
      name: companyName,
      openingBalance,
      entries: [],
    };
await supabase.from("companies").insert([
  {
    name: companyName,
    opening_balance: openingBalance,
  },
]);
    setCompanies([...companies, newCompany]);
    setSelectedCompany(newCompany.id);
    setCompanyName("");
  };

 const deleteCompany = async (id: number) => {
  if (!confirm("Delete company?")) return;

  await supabase
    .from("companies")
    .delete()
    .eq("id", id);

  const updated = companies.filter(
    (c) => c.id !== id
  );

  setCompanies(updated);

  if (selectedCompany === id) {
    setSelectedCompany(null);
    localStorage.removeItem("selectedCompany");
  }
};

  const saveEntry = async () => {
    if (!company) return;

    let autoCredit = Number(credit || 0);

try {
  const isMathExpression = /^[0-9+\-*/().\s]+$/.test(
    description.trim()
  );

  if (isMathExpression) {
    autoCredit = Number(
      Function(
        `"use strict"; return (${description})`
      )()
    );
  }
} catch {
  // Ignore invalid expressions
}

   const entry: Entry = {
  id: editingEntry || Date.now(),
  date: entryDate,
  description,
  credit: autoCredit,
  debit: Number(debit || 0),
};
if (editingEntry) {
  await supabase
    .from("entries")
    .update({
      entry_date: entryDate,
      description,
      credit: autoCredit,
      debit: Number(debit || 0),
    })
    .eq("id", editingEntry);
} else {
  await supabase
    .from("entries")
    .insert([
      {
        company_id: company.id,
        entry_date: entryDate,
        description,
        credit: autoCredit,
        debit: Number(debit || 0),
      },
    ]);
}

    const updated = companies.map((c) => {
      if (c.id !== company.id) return c;

      if (editingEntry) {
        return {
          ...c,
          entries: c.entries.map((e) =>
            e.id === editingEntry ? entry : e
          ),
        };
      }

      return {
        ...c,
        entries: [...c.entries, entry],
      };
    });

    setCompanies(updated);

   await loadEntries(company.id);

setDescription("");
setCredit("");
setDebit("");
setEditingEntry(null);
  };

  const deleteEntry = async (id: number) => {
  if (!company) return;

  await supabase
    .from("entries")
    .delete()
    .eq("id", id);

  const updated = companies.map((c) => {
    if (c.id !== company.id) return c;

    return {
      ...c,
      entries: c.entries.filter(
        (e) => e.id !== id
      ),
    };
  });

  setCompanies(updated);

  await loadEntries(company.id);
};

  return (
  <>
    <div className="header">
      <div className="header-content">
        <h1>
          {company ? company.name : "Ismail Tube Industries"}
        </h1>

        <p>
          {company
            ? "Clear, precise tracking of deliveries and payments."
            : "Select a company to view its ledger."}
        </p>
      </div>
    </div>

    <div className="container">

      {!company && (
        <div className="card" style={{ padding: 30 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h2 className="section-title">
              Your Companies
            </h2>

            <div>
              <input
                placeholder="Company Name"
                value={companyName}
                onChange={(e) =>
                  setCompanyName(e.target.value)
                }
                style={{
                  width: 220,
                  marginRight: 10,
                }}
              />

              <button onClick={addCompany}>
                New Company
              </button>
            </div>
          </div>

          {companies.map((c) => (
            <div
              key={c.id}
              className="card company-card"
onClick={() => {

  setSelectedCompany(c.id);

  localStorage.setItem(
    "selectedCompany",
    String(c.id)
  );

  loadEntries(c.id);

}}
            >
              <strong>{c.name}</strong>

              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCompany(c.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {company && (
        <>
          <button className="back-to-company"
            onClick={() => {
  setSelectedCompany(null);
  localStorage.removeItem(
    "selectedCompany"
  );
}}
            style={{
              marginBottom: 20,
            }}
          >
            ← Back to Companies
          </button>

          <div
            className="card"
            style={{
              padding: 25,
              display: "flex",
              justifyContent:
                "space-between",
              marginBottom: 24,
            }}
          >
            <span>Opening Balance</span>

            <strong>
              Rs{" "}
              {company.openingBalance.toLocaleString()}
            </strong>
          </div>

          <div className="summary-grid">

            <div className="card summary-card">
              <h4>
                Total Credit
              </h4>

              <div className="amount credit">
                Rs{" "}
                {company.entries
                  .reduce(
                    (sum, e) =>
                      sum + e.credit,
                    0
                  )
                  .toLocaleString()}
              </div>
            </div>

            <div className="card summary-card">
              <h4>
                Total Debit
              </h4>

              <div className="amount debit">
                Rs{" "}
                {company.entries
                  .reduce(
                    (sum, e) =>
                      sum + e.debit,
                    0
                  )
                  .toLocaleString()}
              </div>
            </div>

            <div className="card summary-card balance-card">
              <h4>
                Current Balance
              </h4>

              <div className="amount">
                Rs{" "}
                {currentBalance(
                  company
                ).toLocaleString()}
              </div>
            </div>

          </div>

          <div className="content-grid">

            <div  className="left-section">

              <h2 className="section-title">
                Transaction History
              </h2>

              <div className="table-card">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Credit</th>
                      <th>Debit</th>
                      <th>Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {company.entries.map(
                      (
                        entry,
                        index
                      ) => {

                        let balance =
                          company.openingBalance;

                        for (
                          let i = 0;
                          i <= index;
                          i++
                        ) {
                          balance +=
                            company
                              .entries[
                              i
                            ]
                              .credit -
                            company
                              .entries[
                              i
                            ]
                              .debit;
                        }

                        return (
                          <tr
                            key={
                              entry.id
                            }
                          >
                            <td>
  {new Date(entry.date).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )}
</td>

                            <td>
                              {
                                entry.description
                              }
                            </td>

                            <td className="credit">
                              Rs{" "}
                              {
                                entry.credit
                              }
                            </td>

                            <td className="debit">
                              Rs{" "}
                              {
                                entry.debit
                              }
                            </td>

                            <td className="balance">
  Rs {balance}
</td>

                            <td>
  <div className="actions">

    <button
      className="edit-btn"
      onClick={() => {
        setEditingEntry(entry.id);

        setDescription(entry.description);

        setCredit(
          String(entry.credit)
        );

        setDebit(
          String(entry.debit)
        );

        setEntryDate(
          entry.date
        );
      }}
    >
      Edit
    </button>

    <button
      className="delete-btn"
      onClick={() =>
        deleteEntry(entry.id)
      }
    >
      Delete
    </button>

  </div>
</td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            <div className="entry-card">

              <h2>
                {editingEntry
                  ? "Edit Entry"
                  : "Record Entry"}
              </h2>

              <label>Date</label>

              <input
                type="date"
                value={entryDate}
                onChange={(e) =>
                  setEntryDate(
                    e.target.value
                  )
                }
              />

              <label>
                Description
              </label>

              <input
                placeholder="e.g. 500*12"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
              />

              <label>
                Credit
              </label>

              <input
                value={credit}
                onChange={(e) =>
                  setCredit(
                    e.target.value
                  )
                }
              />

              <label>
                Debit
              </label>

              <input
                value={debit}
                onChange={(e) =>
                  setDebit(
                    e.target.value
                  )
                }
              />

              <button
                onClick={saveEntry}
              >
                {editingEntry
                  ? "Update Entry"
                  : "Add Entry"}
              </button>

            </div>

          </div>
        </>
      )}
    </div>
  </>
);
}
