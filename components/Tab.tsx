type TabProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

const Tab = ({ label, active, onClick }: TabProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm transition ${
        active
          ? "bg-orange-500 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
};

export default Tab;