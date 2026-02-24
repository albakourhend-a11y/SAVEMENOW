export default function RoleSelect({ setRole }) {
return (
<div style={{ textAlign: "center", marginTop: "100px" }}>
<h1>Emergency Dispatch System</h1>


<button onClick={() => setRole("citizen")}>Citizen</button>
<button onClick={() => setRole("driver")}>Driver</button>
<button onClick={() => setRole("admin")}>System Admin</button>
</div>
);
}