import AuthForm from "./Authform.jsx";

export default function Login({ onLogin }) {
  return <AuthForm onLogin={onLogin || (() => window.location.assign("/"))} />;
}
