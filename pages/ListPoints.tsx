import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { Loader2, Award, Users } from "lucide-react";

const ListPoints: React.FC = () => {
    const { id } = useParams();
    console.log("Quiz ID:", id);
    const [data, setData] = useState<any>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPoints = async () => {
            try {
                setLoading(true);
                const res = await api.attempt.getAttemptByQuiz(id!);

                setData(res.attempts);
                setTotal(res.total);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPoints();
    }, [id]);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-purple-600" />
            </div>
        );

    if (!data)
        return <div className="text-center mt-20">Không có dữ liệu</div>;

    return (
        <div className="pt-28 pb-20 px-4 max-w-5xl mx-auto">

            {/* Header */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black mb-2">
                        Thống kê kết quả
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Tổng số người đã làm:
                        <span className="ml-2 font-black text-purple-600">
                            {total}
                        </span>
                    </p>
                </div>

                <Users className="w-10 h-10 text-purple-600" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">
                                Tên
                            </th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-center text-gray-400">
                                Điểm
                            </th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-center text-gray-400">
                                Lần làm
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((a: any) => (
                            <tr key={a._id} className="border-t hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-bold">
                                    {a.nameUser || "unknown"}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm inline-flex items-center gap-1">
                                        <Award className="w-4 h-4" />
                                        {a.score}/{a.totalQuestions}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-gray-500">
                                    #{a.attemptNumber}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default ListPoints;