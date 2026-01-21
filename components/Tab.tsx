type TabProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

const Tab = ({ label, active, onClick }: TabProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 ${
        active
          ? "bg-[#FA9529] text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
};

export default Tab;