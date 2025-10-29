import * as React from "react";
import { Button } from "@react-email/components";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export const EmailButton: React.FC<EmailButtonProps> = ({ href, children }) => {
  return (
    <Button style={buttonStyle} href={href}>
      {children}
    </Button>
  );
};

const buttonStyle = {
  backgroundColor: "#5e6ad2",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold",
};
