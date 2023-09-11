#!/bin/bash


# 설정할 변수들
BRANCH_NAME="jeongwoon"

# 직접 변수를 설정할 수 있도록 변경
input_date="2023-09-11"  # 날짜를 직접 설정
commit_message="[Update] socketHandler sharing Update"  # 커밋 메시지를 직접 설정

# 날짜가 유효한지 확인 (Mac OS 호환성을 위해 수정)
if ! date -j -f "%Y-%m-%d" "$input_date" > /dev/null 2>&1; then
    echo "Invalid date. Exiting script."
    exit 1
fi

# 주말인지 확인
day_of_week=$(date -j -f "%Y-%m-%d" "$input_date" +%u)
if [ "$day_of_week" -ge 6 ]; then
    echo "Selected date is a weekend. Exiting script."
    exit 1
fi

# 랜덤으로 시간, 분, 초 생성 (16시부터 18시 사이)
random_hour=$((16 + RANDOM % 3))
random_minute=$((RANDOM % 60))
random_second=$((RANDOM % 60))

# 날짜와 시간, 분, 초 조합
random_date="$input_date $random_hour:$(printf "%02d" $random_minute):$(printf "%02d" $random_second)"

git add .

# commit
git commit -m "$commit_message"

# commit 날짜 수정
GIT_COMMITTER_DATE="$random_date" git commit --amend --no-edit --date="$random_date" -m "$commit_message"

# 리모트 저장소로 푸시 (강제로)
git push origin "$BRANCH_NAME" --force