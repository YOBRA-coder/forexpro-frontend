import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useState } from "react";
import { useApi } from "./api/Api.jsx";
import { C, NAV, bottomNav } from "./constants.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Signals from "./pages/Signals.jsx";
import CopyTrading from "./pages/CopyTrading.jsx";
import Providers from "./pages/Providers.jsx";
import Education from "./pages/Education.jsx";
import Journal from "./pages/Journal.jsx";
import PricesPage from "./pages/PricesPage.jsx";
import Profile from "./pages/Profile.jsx";
import Ticker from "./components/Ticker.jsx";
import { Btn } from "./shared/Shared.jsx";

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("fpx_t") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fpx_u") || "null");
    } catch {
      return null;
    }
  });

  const api = useApi(token);

  const login = (tok, usr) => {
    setToken(tok);
    setUser(usr);

    localStorage.setItem("fpx_t", tok);
    localStorage.setItem("fpx_u", JSON.stringify(usr));
  };

  const logout = () => {
    setToken("");
    setUser(null);

    localStorage.removeItem("fpx_t");
    localStorage.removeItem("fpx_u");

    window.location.href = "/";
  };

  if (!token || !user)
    return (
      <>
        <style>{`
          *,*::before,*::after{
            box-sizing:border-box;
            margin:0;
            padding:0
          }

          body{
            background:${C.bg};
            color:${C.text};
            font-family:'Segoe UI',system-ui,sans-serif
          }
        `}</style>

        <AuthPage onLogin={login} />
      </>
    );

  return (
    <BrowserRouter>
      <>
        <style>{`
html,
body,
#root{
  height:100%;
  margin:0;
  overflow:hidden;
}

body{
  background:${C.bg};
  color:${C.text};
  font-family:'Segoe UI',system-ui,sans-serif;
  font-size:13px;
  overflow-y:auto;
}

.app{
  display:flex;
  height:100vh;
  width:100%;
  overflow:hidden;
}

.main{
 margin-left:194px;
  flex:1;
  min-width:0;
  display:flex;
  flex-direction:column;
  height:100vh;
  overflow:hidden;
}

.content{
   flex:1;
  overflow-y:auto;
  overflow-x:hidden;
  min-width:0;
}

  .sidebar{
  width:194px;
  flex-shrink:0;

  position:fixed;
  top:0;
  left:0;
  bottom:0;

  background:${C.surf};
  border-right:1px solid ${C.border};

  display:flex;
  flex-direction:column;

  overflow-y:auto;
}

          .nav-btn{
            display:flex;
            align-items:center;
            gap:9px;
            padding:9px 14px;
            width:100%;
            border:none;
            text-decoration:none;
            background:transparent;
            color:${C.muted};
            font-size:12px;
            font-weight:500;
            transition:.15s;
          }

          .nav-btn.active{
            background:${C.gold}16;
            color:${C.gold};
          }

          .mobile-nav{
            display:none;
          }

          @media(max-width:768px){

             .sidebar{
    display:none;
  }

  .main{
    margin-left:0;
  }

            .mobile-nav{
              display:flex;
              position:fixed;
              bottom:0;
              left:0;
              right:0;
              height:65px;
              background:${C.surf};
              border-top:1px solid ${C.border};
              z-index:999;
            }

            .mobile-link{
              flex:1;
              display:flex;
              flex-direction:column;
              align-items:center;
              justify-content:center;
              gap:4px;
              text-decoration:none;
              color:${C.muted};
              font-size:10px;
            }

            .mobile-link.active{
              color:${C.gold};
              background:${C.gold}16;
            }

            .content{
            margin-bottom:65px;
          }
            }

          }
        `}</style>

        <div className="app">

          {/* Sidebar */}
          <aside className="sidebar">

            <div
              style={{
                padding: "15px 14px 11px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                Forex<span style={{ color: C.gold }}>Pro</span>
              </div>

              <div
                style={{
                  fontSize: 9,
                  color: C.muted,
                  letterSpacing: 2,
                  marginTop: 2,
                }}
              >
                PROFESSIONAL PLATFORM
              </div>
            </div>

            <nav style={{ padding: "7px 0", flex: 1 }}>
              {NAV.map((n) => (
                <NavLink
                  key={n.id}
                  to={n.id === "dashboard" ? "/" : `/${n.id}`}
                  className={({ isActive }) =>
                    isActive ? "nav-btn active" : "nav-btn"
                  }
                >
                  <span
                    style={{
                      fontSize: 14,
                      width: 18,
                      textAlign: "center",
                    }}
                  >
                    {n.icon}
                  </span>

                  {n.label}
                </NavLink>
              ))}
            </nav>

            <div
              style={{
                padding: "10px 14px",
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: C.gold,
                    color: C.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {user?.username}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color: C.muted,
                    }}
                  >
                    {user?.plan?.toUpperCase()} · $
                    {Number(user?.balance || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="main">

           

            <div
              style={{
                background: C.surf,
                borderBottom: `1px solid ${C.border}`,
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                ForexPro
              </div>
             

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Btn
                  col={C.muted}
                  ghost
                  onClick={logout}
                  style={{
                    fontSize: 11,
                    padding: "5px 12px",
                  }}
                >
                  Sign Out
                </Btn>
                 <div style={{cursor: "pointer"}} onClick={()=>window.location.href("/profile")}>
                  <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: C.gold,
                    color: C.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                 
                  <div
                    style={{
                      fontSize: 10,
                      color: C.muted,
                    }}
                  >
                    {user?.plan?.toUpperCase()} · $
                    {Number(user?.balance || 0).toLocaleString()}
                  </div>
                </div>
                
              </div>
            </div>
            <div style={{ overflow: "hidden", width: "100%" }}>
  <Ticker api={api} />
</div>

            {/* Pages */}
            <div
              className="content"
              style={{
                overflowY: "auto",
                flex: 1,
              }}
            >
              <Routes>
                <Route
                  path="/"
                  element={<Dashboard api={api} />}
                />

                <Route
                  path="/signals"
                  element={<Signals api={api} />}
                />

                <Route
                  path="/copy"
                  element={<CopyTrading api={api} />}
                />

                <Route
                  path="/providers"
                  element={<Providers api={api} />}
                />

                <Route
                  path="/education"
                  element={<Education api={api} />}
                />

                <Route
                  path="/journal"
                  element={<Journal api={api} />}
                />

                <Route
                  path="/prices"
                  element={<PricesPage api={api} />}
                />

                <Route
                  path="/profile"
                  element={
                    <Profile
                      api={api}
                      user={user}
                      setUser={setUser}
                    />
                  }
                />
              </Routes>
            </div>
          </div>

          {/* Bottom Android Nav */}
          <div className="mobile-nav">
            {bottomNav.map((n) => (
              <NavLink
                key={n.id}
                to={n.id === "dashboard" ? "/" : `/${n.id}`}
                className={({ isActive }) =>
                  isActive
                    ? "mobile-link active"
                    : "mobile-link"
                }
              >
                <span style={{ fontSize: 18 }}>
                  {n.icon}
                </span>

                <span>{n.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </>
    </BrowserRouter>
  );
}