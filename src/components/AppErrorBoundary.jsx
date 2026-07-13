import React from 'react';
import { reportClientError } from '../utils/reportClientError';

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        reportClientError(error, {
            source: 'react.error-boundary',
            componentStack: info.componentStack,
        });
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <main className="min-h-screen flex items-center justify-center bg-[#f2f5f3] px-4 text-center">
                <div className="max-w-xl bg-white border-4 border-black p-8 shadow-[8px_8px_0px_rgba(0,0,0,0.3)]">
                    <h1 className="text-3xl font-black mb-4">ページの表示中に問題が発生しました</h1>
                    <p className="font-bold mb-6">再読み込みしても解決しない場合は、時間をおいて再度お試しください。</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="bg-black text-white border-2 border-black px-5 py-3 font-bold hover:bg-[#FFD700] hover:text-black"
                        >
                            再読み込み
                        </button>
                        <a href="/" className="bg-white text-black border-2 border-black px-5 py-3 font-bold hover:bg-yellow-100">
                            ホームへ戻る
                        </a>
                    </div>
                </div>
            </main>
        );
    }
}

export default AppErrorBoundary;
